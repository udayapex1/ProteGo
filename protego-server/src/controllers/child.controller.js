import childService from '../services/child.service.js';

const childController = {
  getDashboard: async (req, res) => {
    try {
      const result = await childService.getDashboard(req.user.userId);
      return res.status(200).json(result);
    } catch (error) {
      const status = error.message.includes('Only parent') || error.message.includes('No child')
        ? 403
        : error.message.includes('not found')
          ? 404
          : 500;
      console.error('Error in child dashboard:', error.message);
      return res.status(status).json({ message: error.message });
    }
  },
};

export default childController;
