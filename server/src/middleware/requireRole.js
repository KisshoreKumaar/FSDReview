import { ApiError } from '../utils/ApiError.js';

/** Role always comes from the DB-backed req.user, never from the request body. */
export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return next(ApiError.unauthorized());
  if (!roles.includes(req.user.role)) return next(ApiError.forbidden());
  return next();
};

export default requireRole;
