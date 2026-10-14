import { User } from '../models/User.js';
import { ROLES } from '../constants/roles.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, created } from '../utils/apiResponse.js';
import { generateOtp, isOtpValid, OTP_TTL_MINUTES } from '../utils/otp.js';
import {
  REFRESH_COOKIE,
  ROTATION_GRACE_MS,
  hashToken,
  clearCookieOptions,
  refreshCookieOptions,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../utils/tokens.js';
import { sendMail } from '../services/mailer.js';
import { otpEmail } from '../services/emailTemplates.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

const issueSession = async (res, user) => {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  user.previousRefreshTokenHash = user.refreshTokenHash;
  user.refreshRotatedAt = new Date();
  user.refreshTokenHash = hashToken(refreshToken);
  user.lastLoginAt = new Date();
  await user.save();
  res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions());
  return accessToken;
};

export const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password } = req.body;

  if (await User.exists({ email: email.toLowerCase() })) {
    throw ApiError.conflict('An account with this email already exists');
  }

  const user = new User({ name, email, phone, role: ROLES.APPLICANT });
  await user.setPassword(password);
  const otp = generateOtp();
  user.otp = otp;
  await user.save();

  const mail = otpEmail({ name, code: otp.code, minutes: OTP_TTL_MINUTES });
  await sendMail({ to: user.email, ...mail });
  if (!env.isProd) logger.info(`[dev] OTP for ${user.email} is ${otp.code}`);

  return created(
    res,
    { email: user.email, ...(env.isProd ? {} : { devOtp: otp.code }) },
    'Registered. Check your email for the verification code.',
  );
});

export const verifyOtp = asyncHandler(async (req, res) => {
  const { email, code } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() }).select('+otp');
  if (!user) throw ApiError.notFound('No account for this email');
  if (user.isEmailVerified) return ok(res, null, 'Email already verified');
  if (!isOtpValid(user.otp, code)) throw ApiError.badRequest('Invalid or expired code');

  user.isEmailVerified = true;
  user.otp = undefined;
  const accessToken = await issueSession(res, user);
  return ok(res, { accessToken, user: user.toPublic() }, 'Email verified');
});

export const resendOtp = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email.toLowerCase() }).select('+otp');
  if (!user) throw ApiError.notFound('No account for this email');
  if (user.isEmailVerified) throw ApiError.badRequest('Email already verified');

  const otp = generateOtp();
  user.otp = otp;
  await user.save();
  await sendMail({ to: user.email, ...otpEmail({ name: user.name, code: otp.code, minutes: OTP_TTL_MINUTES }) });
  if (!env.isProd) logger.info(`[dev] OTP for ${user.email} is ${otp.code}`);
  return ok(res, env.isProd ? null : { devOtp: otp.code }, 'A new code has been sent');
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  if (!user || !(await user.verifyPassword(password))) {
    throw ApiError.unauthorized('Invalid email or password');
  }
  if (!user.isActive) throw ApiError.forbidden('Account disabled');
  if (!user.isEmailVerified) {
    throw new ApiError(403, 'Email not verified', [{ field: 'email', message: 'VERIFY_REQUIRED' }]);
  }

  const accessToken = await issueSession(res, user);
  return ok(res, { accessToken, user: user.toPublic() }, 'Signed in');
});

export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (!token) throw ApiError.unauthorized('No refresh token');

  const payload = verifyRefreshToken(token);
  const user = await User.findById(payload.sub).select(
    '+refreshTokenHash +previousRefreshTokenHash +refreshRotatedAt',
  );
  const presented = hashToken(token);
  const withinGrace =
    user?.previousRefreshTokenHash === presented &&
    Date.now() - new Date(user.refreshRotatedAt || 0).getTime() < ROTATION_GRACE_MS;

  if (!user || (user.refreshTokenHash !== presented && !withinGrace)) {
    throw ApiError.unauthorized('Refresh token no longer valid');
  }

  const accessToken = await issueSession(res, user);
  return ok(res, { accessToken, user: user.toPublic() }, 'Session refreshed');
});

export const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (token) {
    try {
      const payload = verifyRefreshToken(token);
      await User.findByIdAndUpdate(payload.sub, {
        $unset: { refreshTokenHash: 1, previousRefreshTokenHash: 1, refreshRotatedAt: 1 },
      });
    } catch {
      /* expired token — clearing the cookie is enough */
    }
  }
  res.clearCookie(REFRESH_COOKIE, clearCookieOptions());
  return ok(res, null, 'Signed out');
});

export const me = asyncHandler(async (req, res) => ok(res, { user: req.user.toPublic() }, 'OK'));
