import userRepository from "../repositories/user.repository.js";
import {
  generateRefreshToken,
  generateAccessToken,
  verifyRefreshToken,
} from "../utils/jwt.js";
import {
  generateTOTPSecret,
  verifyTOTP,
  generateQRCode,
} from "../utils/totp.js";
import sendMail from "../utils/mailer.js";

const authService = {
  register: async ({ name, email, password, role }) => {
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) throw new Error("Email already registered..");

    const user = await userRepository.create({
      name,
      email,
      password,
      role,
    });

    const accessToken = generateAccessToken(user._id, user._role);
    const refreshToken = generateRefreshToken(user._id);

    await userRepository.updateById(user._id, { refreshToken });

    return {
      accessToken,
      refreshToken,
      user: { id: user._id, name: user.name, role: user.role },
    };
  },

  login: async ({ email, password }) => {
    const user = await userRepository.findByEmail(email);
    if (!user) throw new Error("Invalid Credentials..");

    const isMatch = await user.comparePassword(password);
    if (!isMatch) throw new Error("Invalid credentials");

    if (user.isTwoFactorEnabled) {
      return { requiresTwoFactor: true, userId: user._id };
    }

    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    await userRepository.updateById(user._id, { refreshToken });

    return {
      accessToken,
      refreshToken,
      user: { id: user._id, name: user.name, role: user.role },
    };
  },
    validateTwoFactor: async ({ userId, token }) => {
    const user = await userRepository.findById(userId);
    if (!user) throw new Error('User not found');

    const isValid = verifyTOTP(user.twoFactorSecret, token);
    if (!isValid) throw new Error('Invalid 2FA code');

    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    await userRepository.updateById(user._id, { refreshToken });

    return { accessToken, refreshToken, user: { id: user._id, name: user.name, role: user.role } };
  },

  refresh: async (token) => {
    const decoded = verifyRefreshToken(token);
    const user = await userRepository.findById(decoded.userId);

    if (!user || user.refreshToken !== token) throw new Error('Invalid refresh token');

    const accessToken = generateAccessToken(user._id, user.role);
    return { accessToken };
  },

  logout: async (userId) => {
    await userRepository.updateById(userId, { refreshToken: null });
  },

  setupTwoFactor: async (userId) => {
    const user = await userRepository.findById(userId);
    const secret = generateTOTPSecret(user.email);
    const qrCode = await generateQRCode(secret.otpauth_url);

    await userRepository.updateById(userId, { twoFactorSecret: secret.base32 });

    return { qrCode, secret: secret.base32 };
  },

  enableTwoFactor: async ({ userId, token }) => {
    const user = await userRepository.findById(userId);
    const isValid = verifyTOTP(user.twoFactorSecret, token);
    if (!isValid) throw new Error('Invalid 2FA code');

    await userRepository.updateById(userId, { isTwoFactorEnabled: true });
  }

};


export default authService;
