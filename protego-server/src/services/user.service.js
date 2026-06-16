import userRepository from '../repositories/user.repository.js';

const userService = {

  getProfile: async (userId) => {
    const user = await userRepository.findById(userId);
    if (!user) throw new Error('User not found');
    return {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      pairedWith: user.pairedWith,
      isTwoFactorEnabled: user.isTwoFactorEnabled,
      createdAt: user.createdAt
    };
  },

  updateProfile: async (userId, data) => {
    const allowed = {};
    if (data.name) allowed.name = data.name;

    const updated = await userRepository.updateById(userId, allowed);
    return {
      id: updated._id,
      name: updated.name,
      email: updated.email,
      role: updated.role
    };
  },

  deleteAccount: async (userId) => {
    const user = await userRepository.findById(userId);
    if (user.pairedWith) {
      await userRepository.updateById(user.pairedWith, { pairedWith: null });
    }
    await userRepository.deleteById(userId);
    return { message: 'Account deleted successfully' };
  }

};

export default userService;