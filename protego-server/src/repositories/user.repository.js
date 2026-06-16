import User from '../models/user.model.js';

const userRepository = {
  create: async (data) => {
    const user = new User(data);
    return await user.save();
  },

  findByEmail: async (email) => {
    return await User.findOne({ email: email.trim().toLowerCase() });
  },

  findById: async (id) => {
    return await User.findById(id);
  },

  findByValidResetToken: async (resetPasswordToken) => {
    return await User.findOne({
      resetPasswordToken,
      resetPasswordExpiry: { $gt: new Date() }
    });
  },

  updateById: async (id, data) => {
    return await User.findByIdAndUpdate(id, data, { new: true });
  },
  deleteById: async (id) => {
  return await User.findByIdAndDelete(id);
},

  findByPairingCode: async (code) => {
    return await User.findOne({ 
      pairingCode: code,
      pairingCodeExpiry: { $gt: new Date() }
    });
  }
};

export default userRepository;
