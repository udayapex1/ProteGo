import authService from "../services/auth.service.js";

const authControllers = {
  register: async (req, res) => {
    try {
      const result = await authService.register(req.body);
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  login: async (req, res) => {
    try {
      const result = await authService.login(req.body);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },
    validateTwoFactor: async (req, res) => {
    try {
      const result = await authService.validateTwoFactor(req.body);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },
  refresh: async (req, res) => {
    try {
      const { refreshToken } = req.body;
      const result = await authService.refresh(refreshToken);
      res.status(200).json(result);
    } catch (error) {
      res.status(401).json({ message: error.message });
    }
  },

  logout: async (req, res) => {
    try {
      await authService.logout(req.user.userId);
      res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  setupTwoFactor: async (req, res) => {
    try {
      const result = await authService.setupTwoFactor(req.user.userId);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  enableTwoFactor: async (req, res) => {
    try {
      await authService.enableTwoFactor({ userId: req.user.userId, token: req.body.token });
      res.status(200).json({ message: '2FA enabled successfully' });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  forgotPassword: async (req, res) => {
    try {
      await authService.forgotPassword(req.body.email);
      res.status(200).json({
        message: 'If an account exists for that email, a password reset link has been sent'
      });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  resetPassword: async (req, res) => {
    try {
      await authService.resetPassword({
        token: req.params.token,
        password: req.body.password
      });
      res.status(200).json({ message: 'Password reset successfully' });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }


};
 export default authControllers;
