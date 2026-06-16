import pairingService from '../services/pairing.service.js';

const pairingController = {

  generateCode: async (req, res) => {
    try {
      const result = await pairingService.generateCode(req.user.userId);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  joinWithCode: async (req, res) => {
    try {
      const { code } = req.body;
      const result = await pairingService.joinWithCode(req.user.userId, code);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  unpair: async (req, res) => {
    try {
      const result = await pairingService.unpair(req.user.userId);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  getPairedUser: async (req, res) => {
    try {
      const result = await pairingService.getPairedUser(req.user.userId);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

};

export default pairingController;