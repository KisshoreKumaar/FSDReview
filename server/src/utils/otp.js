import crypto from 'node:crypto';

const OTP_TTL_MINUTES = 10;

export const generateOtp = () => ({
  code: String(crypto.randomInt(100000, 1000000)),
  expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000),
});

export const isOtpValid = (otp, code) =>
  Boolean(otp?.code) && otp.code === String(code).trim() && otp.expiresAt > new Date();

export { OTP_TTL_MINUTES };
