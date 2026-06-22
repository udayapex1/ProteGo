import geofenceService from '../services/geofence.service.js';

const geofenceController = {

  create: async (req, res) => {
    try {
      const result = await geofenceService.create(req.user.userId, req.body);
      return res.status(201).json(result);
    } catch (error) {
      console.error('❌ Error in create geofence:', error.message);
      return res.status(400).json({ message: error.message });
    }
  },

  getParentZones: async (req, res) => {
    try {
      const result = await geofenceService.getParentZones(req.user.userId);
      return res.status(200).json(result);
    } catch (error) {
      console.error('❌ Error in getParentZones:', error.message);
      return res.status(500).json({ message: error.message });
    }
  },

  getChildZones: async (req, res) => {
    try {
      const result = await geofenceService.getChildZones(req.user.userId);
      return res.status(200).json(result);
    } catch (error) {
      console.error('❌ Error in getChildZones:', error.message);
      return res.status(500).json({ message: error.message });
    }
  },

  deactivate: async (req, res) => {
    try {
      const result = await geofenceService.deactivate(req.params.id, req.user.userId);
      return res.status(200).json(result);
    } catch (error) {
      console.error('❌ Error in deactivate geofence:', error.message);
      return res.status(400).json({ message: error.message });
    }
  },

  handleBreach: async (req, res) => {
    try {
      const result = await geofenceService.handleBreach(req.user.userId, req.body);
      return res.status(200).json(result);
    } catch (error) {
      console.error('❌ Error in handleBreach:', error.message);
      return res.status(500).json({ message: error.message });
    }
  },
  update: async (req, res) => {
  try {
    const result = await geofenceService.update(req.params.id, req.user.userId, req.body);
    return res.status(200).json(result);
  } catch (error) {
    console.error('❌ Error in update geofence:', error.message);
    return res.status(400).json({ message: error.message });
  }
},

};

export default geofenceController;