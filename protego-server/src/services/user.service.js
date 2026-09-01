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
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      throw new Error('Profile data must be an object');
    }

    const allowed = {};

    if (Object.prototype.hasOwnProperty.call(data, 'name')) {
      if (typeof data.name !== 'string') throw new Error('Name must be a string');
      const name = data.name.trim();
      if (name.length < 2 || name.length > 80) {
        throw new Error('Name must be between 2 and 80 characters');
      }
      allowed.name = name;
    }

    if (Object.prototype.hasOwnProperty.call(data, 'email')) {
      if (typeof data.email !== 'string') throw new Error('Email must be a string');
      const email = data.email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error('Please provide a valid email address');
      }

      const existingUser = await userRepository.findByEmailExceptId(email, userId);
      if (existingUser) throw new Error('Email is already in use');
      allowed.email = email;
    }

    if (Object.keys(allowed).length === 0) {
      throw new Error('Provide a name or email to update');
    }

    const updated = await userRepository.updateById(userId, allowed);
    if (!updated) throw new Error('User not found');

    return {
      id: updated._id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      pairedWith: updated.pairedWith,
      isTwoFactorEnabled: updated.isTwoFactorEnabled
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
