import geofenceRepository from '../repositories/geofence.repository.js';
import pairingRepository from '../repositories/pairing.repository.js';
import { getIO } from '../config/socket.js';
import sendMail from '../utils/mailer.js';

const geofenceService = {

  create: async (parentId, data) => {
    // 1. Structural Validation Guards
    if (!data.longitude || !data.latitude || !data.radius || !data.name) {
      throw new Error('Validation Failed: Missing required parameters for zone setup.');
    }

    const parent = await pairingRepository.findById(parentId);
    if (!parent || !parent.pairedWith) throw new Error('Action Denied: Not paired with any child account.');

    return await geofenceRepository.create({
      parentId,
      childId: parent.pairedWith,
      name: data.name,
      center: {
        type: 'Point',
        coordinates: [parseFloat(data.longitude), parseFloat(data.latitude)] // Sanity parsing to float numbers
      },
      radius: data.radius
    });
  },

  getParentZones: async (parentId) => {
    return await geofenceRepository.findByParentId(parentId);
  },

  getChildZones: async (childId) => {
    return await geofenceRepository.findByChildId(childId);
  },

  deactivate: async (geofenceId, parentId) => {
    const result = await geofenceRepository.deactivate(geofenceId, parentId);
    if (!result) throw new Error('Zone not found or unauthorized deletion request.');
    return { message: 'Zone deleted successfully' };
  },

  handleBreach: async (childId, data) => {
    // Single optimization lookup: Retrieve child and parent context concurrently if database allows, 
    // or maximize existing return parameters
    const child = await pairingRepository.findById(childId);
    if (!child || !child.pairedWith) throw new Error('Action Denied: Device is unlinked.');

    const parentId = child.pairedWith.toString();
    
    // FIXED: Enforcing explicit standard formatting for Socket.IO room IDs (ParentID-ChildID)
const roomId = [parentId.toString(), childId.toString()].sort().join('-');
console.log(`📡 Emitting to room: ${roomId}`);  
const io = getIO();

    // Broadcast real-time event alerts to connected clients within the paired room channel
    io.to(roomId).emit('geofence:breach', {
      childId,
      geofenceId: data.geofenceId,
      geofenceName: data.geofenceName,
      type: data.type, // Expects 'enter' or 'exit'
      latitude: data.latitude,
      longitude: data.longitude,
      timestamp: Date.now()
    });

    // Handle background notification delivery workflows without awaiting
    pairingRepository.findById(parentId).then(async (parent) => {
      if (parent && parent.email) {
        const motionVerb = data.type === 'enter' ? 'entered' : 'exited';
        
        sendMail({
          to: parent.email,
          subject: `📍 Geofence Alert - ${data.geofenceName} - Protego`,
          html: `<h2>Geofence Boundary Breach Detected</h2>
                 <p><strong>${child.name || 'Your Child'}</strong> has <strong>${motionVerb}</strong> the monitored zone: <strong>${data.geofenceName}</strong>.</p>
                 <p>View current tracking vector path: <a href="https://maps.google.com/?q=${data.latitude},${data.longitude}">Open in Google Maps</a></p>`
        }).catch(err => console.error("⚠️ Background Geofence Mailer Failure:", err));
      }
    }).catch(err => console.error("⚠️ Background Parent Lookup Failure during Breach event:", err));

    return { message: 'Breach alert metrics routed successfully.' };
  },
  update: async (geofenceId, parentId, data) => {
  if (!data.name || !data.latitude || !data.longitude || !data.radius) {
    throw new Error('Validation Failed: Missing required parameters for zone update.');
  }
  
  const result = await geofenceRepository.update(geofenceId, parentId, data);
  if (!result) throw new Error('Zone not found or unauthorized update request.');
  return result;
},

};

export default geofenceService;