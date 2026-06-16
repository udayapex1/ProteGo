import userService from '../services/user.service.js';

const userController = {

  getProfile: async (req, res) => {
    try {
      const result = await userService.getProfile(req.user.userId);
      return res.status(200).json(result);
    } catch (error) {
      console.error('❌ Error in getProfile:', error.message);
      return res.status(404).json({ message: error.message });
    }
  },

  updateProfile: async (req, res) => {
    try {
      const result = await userService.updateProfile(req.user.userId, req.body);
      return res.status(200).json(result);
    } catch (error) {
      console.error('❌ Error in updateProfile:', error.message);
      return res.status(400).json({ message: error.message });
    }
  },

  deleteAccount: async (req, res) => {
    try {
      const result = await userService.deleteAccount(req.user.userId);
      return res.status(200).json(result);
    } catch (error) {
      console.error('❌ Error in deleteAccount:', error.message);
      return res.status(500).json({ message: error.message });
    }
  }

};

export default userController;