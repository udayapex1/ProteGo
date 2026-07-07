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
  const mapsUrl = `https://maps.google.com/?q=${data.latitude},${data.longitude}`;
  const batteryColor = data.battery > 50 ? '#22C55E' : data.battery > 20 ? '#F59E0B' : '#EF4444';
  const timestamp = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  // const logoUrl = 'https://res.cloudinary.com/dwemivxbp/image/upload/v1783442324/WhatsApp_Image_2026-07-07_at_10.37.09_AM_ghfccx.jpg'; // replace with your hosted Protego logo URL

  sendMail({
    to: parent.email,
    subject: `🚨 SOS Alert from ${user.name || 'Your Child'} - Protego`,
    html: `
    <!DOCTYPE html>
    <html>
    <body style="margin:0; padding:0; background-color:#F4F4F7; font-family:'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F4F4F7; padding:32px 16px;">
        <tr>
          <td align="center">
            <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.08);">

              // <!-- Logo header -->
              // <tr>
              //   <td style="background:#ffffff; padding:24px; text-align:center; border-bottom:1px solid #F0F0F0;">
              //     <img src="${logoUrl}" alt="Protego" width="150" style="display:block; margin:0 auto;" />
              //   </td>
              // </tr>

              <!-- Alert banner -->
              <tr>
                <td style="background:linear-gradient(135deg, #EF4444 0%, #7C3AED 100%); padding:22px 24px; text-align:center;">
                  <div style="color:#ffffff; font-size:18px; font-weight:700; letter-spacing:0.3px;">
                    🚨 SOS Alert Triggered
                  </div>
                  <div style="color:rgba(255,255,255,0.85); font-size:13px; margin-top:4px;">
                    ${timestamp}
                  </div>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding:28px 24px 8px;">
                  <p style="margin:0 0 20px; font-size:15px; color:#374151; line-height:1.5;">
                    <strong style="color:#111827;">${user.name || 'Your Child'}</strong> has triggered an SOS alert and may need immediate assistance.
                  </p>

                  <!-- Location card (no image dependency, always renders) -->
                  <a href="${mapsUrl}" style="display:block; text-decoration:none; margin-bottom:16px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB; border-radius:12px; border:1px solid #E5E7EB;">
                      <tr>
                        <td style="padding:18px; text-align:center;">
                          <div style="font-size:28px; margin-bottom:6px;">📍</div>
                          <div style="font-size:13px; color:#7C3AED; font-weight:600;">Tap to view live map</div>
                          <div style="font-size:11px; color:#9CA3AF; margin-top:2px;">${data.latitude.toFixed(5)}, ${data.longitude.toFixed(5)}</div>
                        </td>
                      </tr>
                    </table>
                  </a>

                  <!-- Info cards -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
                    <tr>
                      <td width="48%" style="background:#F9FAFB; border-radius:10px; padding:14px; vertical-align:top;">
                        <div style="font-size:11px; color:#9CA3AF; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px;">Location</div>
                        <div style="font-size:13px; color:#111827; font-weight:600;">${data.latitude.toFixed(5)}, ${data.longitude.toFixed(5)}</div>
                      </td>
                      <td width="4%"></td>
                      <td width="48%" style="background:#F9FAFB; border-radius:10px; padding:14px; vertical-align:top;">
                        <div style="font-size:11px; color:#9CA3AF; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px;">Battery</div>
                        <div style="font-size:13px; color:${batteryColor}; font-weight:600;">${data.battery}%</div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- CTA -->
              <tr>
                <td style="padding:8px 24px 28px;">
                  <a href="${mapsUrl}" style="display:block; text-align:center; background:#7C3AED; color:#ffffff; text-decoration:none; font-size:15px; font-weight:600; padding:14px; border-radius:12px;">
                    View Live Location →
                  </a>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding:16px 24px; background:#FAFAFA; border-top:1px solid #F0F0F0; text-align:center;">
                  <div style="font-size:12px; color:#9CA3AF;">
                    Sent automatically by <strong style="color:#7C3AED;">Protego</strong> Family Safety
                  </div>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    `
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