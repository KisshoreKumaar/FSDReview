import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const signAccessToken = (user) =>
  jwt.sign({ sub: String(user._id), role: user.role }, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessTtl,
  });

export const signRefreshToken = (user) =>
  jwt.sign({ sub: String(user._id), typ: 'refresh' }, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshTtl,
  });

export const verifyAccessToken = (token) => jwt.verify(token, env.jwt.accessSecret);

export const verifyRefreshToken = (token) => jwt.verify(token, env.jwt.refreshSecret);

export const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

export const REFRESH_COOKIE = 'cams_refresh';

/** How long a just-rotated refresh token keeps working. */
export const ROTATION_GRACE_MS = 30 * 1000;

const baseCookieOptions = () => ({
  httpOnly: true,
  sameSite: 'lax',
  secure: env.isProd,
  path: '/api/v1/auth',
});

export const refreshCookieOptions = () => ({
  ...baseCookieOptions(),
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

/** clearCookie must not carry maxAge (deprecated in Express 5). */
export const clearCookieOptions = () => baseCookieOptions();
