import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { verifyAccessToken } from '../utils/tokens.js';

const extractToken = (req) => {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7).trim();
  return null;
};

/** Fails closed: no token, bad token or unknown user all end as 401. */
export const authenticate = asyncHandler(async (req, res, next) => {
  const token = extractToken(req);
  if (!token) throw ApiError.unauthorized('Authentication required');

  const payload = verifyAccessToken(token);
  const user = await User.findById(payload.sub).select('+refreshTokenHash');
  if (!user) throw ApiError.unauthorized('Account no longer exists');
  if (!user.isEmailVerified) throw ApiError.forbidden('Verify your email to continue');

  req.user = user;
  next();
});

export default authenticate;
