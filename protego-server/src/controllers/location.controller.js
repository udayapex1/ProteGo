import locationService from '../services/location.service.js';
import pairingRepository from '../repositories/pairing.repository.js'; // Needed to verify access rights

const locationController = {

  updateLocation: async (req, res) => {
    try {
      const result = await locationService.updateLocation(req.user.userId, req.body);
      return res.status(200).json(result);
    } catch (error) {
      console.error(" Error in updateLocation:", error.message);
      return res.status(500).json({ message: "Internal server error updating telemetry." });
    }
  },

  syncBatch: async (req, res) => {
    try {
      const { locations } = req.body;
      if (!locations || !Array.isArray(locations)) {
        return res.status(400).json({ message: "Invalid payload format. Expected 'locations' array." });
      }
      
      const result = await locationService.syncBatch(req.user.userId, locations);
      return res.status(200).json({ synced: result.length });
    } catch (error) {
      console.error(" Error in syncBatch:", error.message);
      return res.status(500).json({ message: "Internal server error processing historical sync batch." });
    }
  },

  getLatest: async (req, res) => {
    try {
      const targetUserId = req.params.userId;
      
      // SECURITY GUARD: Verify the requester is authorized to track this specific device
      const requester = await pairingRepository.findById(req.user.userId);
      if (!requester || requester.pairedWith?.toString() !== targetUserId) {
        return res.status(403).json({ message: "Access Denied: You are not paired with this device." });
      }

      const result = await locationService.getLatest(targetUserId);
      return res.status(200).json(result);
    } catch (error) {
      console.error(" Error in getLatest:", error.message);
      return res.status(500).json({ message: "Internal server error fetching latest telemetry." });
    }
  },

  getHistory: async (req, res) => {
    try {
      const targetUserId = req.params.userId;
      
      // SECURITY GUARD: Verify direct authorization link
      const requester = await pairingRepository.findById(req.user.userId);
      if (!requester || requester.pairedWith?.toString() !== targetUserId) {
        return res.status(403).json({ message: "Access Denied: You are not paired with this device." });
      }

      // DATA TYPE CASTING FIX: Sanitize query string inputs safely to integers
      const hours = req.query.hours ? parseInt(req.query.hours, 10) : 24;
      if (isNaN(hours)) {
        return res.status(400).json({ message: "Query parameter 'hours' must be a valid integer." });
      }

      const result = await locationService.getHistory(targetUserId, hours);
      return res.status(200).json(result);
    } catch (error) {
      console.error("Error in getHistory:", error.message);
      return res.status(500).json({ message: "Internal server error fetching route history." });
    }
  },

  getSOSLocations: async (req, res) => {
    try {
      const targetUserId = req.params.userId;
      
      // SECURITY GUARD: Verify direct authorization link
      const requester = await pairingRepository.findById(req.user.userId);
      if (!requester || requester.pairedWith?.toString() !== targetUserId) {
        return res.status(403).json({ message: "Access Denied: You are not paired with this device." });
      }

      const result = await locationService.getSOSLocations(targetUserId);
      return res.status(200).json(result);
    } catch (error) {
      console.error(" Error in getSOSLocations:", error.message);
      return res.status(500).json({ message: "Internal server error fetching emergency logs." });
    }
  }

};

export default locationController;