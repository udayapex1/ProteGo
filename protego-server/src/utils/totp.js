
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';

const generateTOTPSecret = (email) => {
  return speakeasy.generateSecret({
    name: `Protego:${email}`,
    length: 20
  });
};

const verifyTOTP = (secret, token) => {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 1
  });
};

const generateQRCode = async (otpauthUrl) => {
  return await qrcode.toDataURL(otpauthUrl);
};

export { generateTOTPSecret, verifyTOTP, generateQRCode };