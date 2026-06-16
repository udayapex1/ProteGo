import locationRepository from '../repositories/location.repository.js';
import pairingRepository from '../repositories/pairing.repository.js';
import sendMail from '../utils/mailer.js';
import { getIO } from '../config/socket.js';

const locationService = {

  updateLocation: async (userId, data) => {
    const location = await locationRepository.save({
      userId,
      location: {
        type: 'Point',
        coordinates: [data.longitude, data.latitude]
      },
      battery: data.battery,
      network: data.network,
      isSOS: data.isSOS || false,
      createdAt: data.timestamp || Date.now()
    });

    // Socket emit — fire and forget
    pairingRepository.findById(userId).then(async (user) => {
      if (user?.pairedWith) {
        const roomId = [userId.toString(), user.pairedWith.toString()].sort().join('-');
        const io = getIO();

        // Live location emit
        io.to(roomId).emit('location:update', {
          userId,
          latitude: data.latitude,
          longitude: data.longitude,
          battery: data.battery,
          network: data.network,
          isSOS: data.isSOS || false,
          timestamp: data.timestamp || Date.now()
        });

        // SOS handling
        if (data.isSOS) {
          io.to(roomId).emit('sos:alert', {
            userId,
            latitude: data.latitude,
            longitude: data.longitude,
            battery: data.battery,
            timestamp: data.timestamp || Date.now()
          });

          const parent = await pairingRepository.findById(user.pairedWith);
          if (parent?.email) {
            sendMail({
              to: parent.email,
              subject: '🚨 SOS Alert - Protego',
              html: `<h2>SOS Alert!</h2>
                     <p><strong>${user.name || 'Your Child'}</strong> has triggered an SOS alert.</p>
                     <p>Last known location: <a href="https://maps.google.com/?q=${data.latitude},${data.longitude}">${data.latitude}, ${data.longitude}</a></p>
                     <p>Battery: ${data.battery}%</p>`
            }).catch(err => console.error("⚠️ Mailer Failed:", err));
          }
        }
      }
    }).catch(err => console.error("⚠️ Socket Emit Failed:", err));

    return location;
  },

  syncBatch: async (userId, locations) => {
    if (!locations || locations.length === 0) return [];

    const formatted = locations.map(d => ({
      userId,
      location: {
        type: 'Point',
        coordinates: [d.longitude, d.latitude]
      },
      battery: d.battery,
      network: d.network,
      isSOS: d.isSOS || false,
      createdAt: d.timestamp || Date.now() // Preserves the historic offline timeline tracking
    }));

    return await locationRepository.saveBatch(formatted);
  },

  getLatest: async (userId) => {
    return await locationRepository.getLatest(userId);
  },

  getHistory: async (userId, hours) => {
    return await locationRepository.getHistory(userId, hours);
  },

  getSOSLocations: async (userId) => {
    return await locationRepository.getSOSLocations(userId);
  }

};

export default locationService;