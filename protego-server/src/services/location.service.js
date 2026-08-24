import locationRepository from '../repositories/location.repository.js';
import pairingRepository from '../repositories/pairing.repository.js';
import sendMail from '../utils/mailer.js';
import { getIO } from '../config/socket.js';

const locationService = {

  updateLocation: async (userId, data) => {
    console.log('📥 Telemetry received:', {
      userId: userId.toString(),
      latitude: data.latitude,
      longitude: data.longitude,
      battery: data.battery,
      network: data.network,
      isSOS: Boolean(data.isSOS),
      timestamp: data.timestamp,
    });

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

    console.log('✅ Telemetry persisted:', {
      id: location._id.toString(),
      userId: userId.toString(),
      battery: location.battery,
      isSOS: location.isSOS,
      createdAt: location.createdAt,
    });

    // Notifications run after the telemetry is safely persisted. Socket and email
    // failures are isolated so a socket issue can never suppress an SOS email.
    void (async () => {
      try {
        const user = await pairingRepository.findById(userId);
        if (!user?.pairedWith) {
          console.warn('⚠️ Telemetry notification skipped: child is not paired.', { userId: userId.toString() });
          return;
        }

        const roomId = [userId.toString(), user.pairedWith.toString()].sort().join('-');
        const eventPayload = {
          userId: userId.toString(),
          latitude: data.latitude,
          longitude: data.longitude,
          battery: location.battery,
          network: data.network,
          isSOS: location.isSOS,
          timestamp: location.createdAt,
        };

        try {
          const io = getIO();
          io.to(roomId).emit('location:update', eventPayload);
          console.log('📡 location:update emitted:', { roomId, battery: location.battery, isSOS: location.isSOS });

          if (location.isSOS) {
          io.to(roomId).emit('sos:alert', {
              userId: userId.toString(),
              latitude: data.latitude,
              longitude: data.longitude,
              battery: location.battery,
              timestamp: location.createdAt,
          });
            console.log('🚨 sos:alert emitted:', { roomId, battery: location.battery });
          }
        } catch (error) {
          console.error('❌ Socket notification failed:', { userId: userId.toString(), message: error.message });
        }

        if (location.isSOS) {
          const parent = await pairingRepository.findById(user.pairedWith);
          if (!parent?.email) {
            console.error('❌ SOS email skipped: paired parent has no email.', { parentId: user.pairedWith.toString() });
            return;
          }

          console.log('🚨 SOS email queued:', { childId: userId.toString(), parentId: parent._id.toString(), to: parent.email });
  const mapsUrl = `https://maps.google.com/?q=${data.latitude},${data.longitude}`;
  const batteryColor = location.battery > 50 ? '#22C55E' : location.battery > 20 ? '#F59E0B' : '#EF4444';
  const timestamp = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  // const logoUrl = 'https://res.cloudinary.com/dwemivxbp/image/upload/v1783442324/WhatsApp_Image_2026-07-07_at_10.37.09_AM_ghfccx.jpg'; // replace with your hosted Protego logo URL

 sendMail({
    to: parent.email,
    subject: `SOS Alert from ${user.name || 'Your Child'} - Protego`,
    html: `
    <!DOCTYPE html>
    <html>
    <body style="margin:0; padding:0; background-color:#F1F2F5; font-family:'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F1F2F5; padding:32px 16px;">
        <tr>
          <td align="center">
            <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:10px; overflow:hidden; border:1px solid #E5E7EB;">

              <!-- Alert banner -->
              <tr>
                <td style="background:#1F2937; padding:24px 28px; text-align:left; border-bottom:3px solid #DC2626;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="vertical-align:middle;">
                        <div style="color:#ffffff; font-size:17px; font-weight:700; letter-spacing:0.2px;">
                          SOS Alert Triggered
                        </div>
                        <div style="color:#9CA3AF; font-size:12px; margin-top:4px;">
                          ${timestamp}
                        </div>
                      </td>
                      <td align="right" style="vertical-align:middle;">
                        <div style="background:#DC2626; color:#ffffff; font-size:11px; font-weight:700; padding:5px 10px; border-radius:4px; letter-spacing:0.5px;">
                          URGENT
                        </div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding:28px 28px 8px;">
                  <p style="margin:0 0 22px; font-size:15px; color:#374151; line-height:1.6;">
                    <strong style="color:#111827;">${user.name || 'Your Child'}</strong> has triggered an SOS alert and may need immediate assistance. Please review the details below.
                  </p>

                  <!-- Location card -->
                  <a href="${mapsUrl}" style="display:block; text-decoration:none; margin-bottom:16px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB; border-radius:8px; border:1px solid #E5E7EB;">
                      <tr>
                        <td style="padding:18px 20px; text-align:left;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="vertical-align:middle;">
                                <div style="font-size:11px; color:#6B7280; text-transform:uppercase; letter-spacing:0.5px; font-weight:600; margin-bottom:4px;">Current Location</div>
                                <div style="font-size:13px; color:#111827; font-weight:600;">${data.latitude.toFixed(5)}, ${data.longitude.toFixed(5)}</div>
                              </td>
                              <td align="right" style="vertical-align:middle;">
                                <div style="font-size:12px; color:#1F2937; font-weight:600; border:1px solid #D1D5DB; padding:6px 12px; border-radius:6px;">
                                  View Map
                                </div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </a>

                  <!-- Info cards -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
                    <tr>
                      <td width="48%" style="background:#F9FAFB; border-radius:8px; border:1px solid #E5E7EB; padding:14px 16px; vertical-align:top;">
                        <div style="font-size:11px; color:#6B7280; text-transform:uppercase; letter-spacing:0.5px; font-weight:600; margin-bottom:4px;">Coordinates</div>
                        <div style="font-size:13px; color:#111827; font-weight:600;">${data.latitude.toFixed(5)}, ${data.longitude.toFixed(5)}</div>
                      </td>
                      <td width="4%"></td>
                      <td width="48%" style="background:#F9FAFB; border-radius:8px; border:1px solid #E5E7EB; padding:14px 16px; vertical-align:top;">
                        <div style="font-size:11px; color:#6B7280; text-transform:uppercase; letter-spacing:0.5px; font-weight:600; margin-bottom:4px;">Battery</div>
                        <div style="font-size:13px; color:${batteryColor}; font-weight:600;">${location.battery}%</div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- CTA -->
              <tr>
                <td style="padding:12px 28px 28px;">
                  <a href="${mapsUrl}" style="display:block; text-align:center; background:#1F2937; color:#ffffff; text-decoration:none; font-size:14px; font-weight:600; padding:14px; border-radius:8px; letter-spacing:0.2px;">
                    View Live Location
                  </a>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding:16px 28px; background:#FAFAFA; border-top:1px solid #F0F0F0; text-align:center;">
                  <div style="font-size:12px; color:#9CA3AF;">
                    Sent automatically by <strong style="color:#1F2937;">Protego</strong> Family Safety
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
  }).catch(err => console.error('❌ SOS email delivery failed:', { to: parent.email, message: err.message }));
        }
      } catch (error) {
        console.error('❌ Telemetry notification processing failed:', { userId: userId.toString(), message: error.message });
      }
    })();

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
