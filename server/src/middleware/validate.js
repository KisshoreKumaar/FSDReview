import { validationResult } from 'express-validator';
import { ApiError } from '../utils/ApiError.js';

/** Run after express-validator chains; turns their result into a 400. */
export const validate = (req, res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const errors = result.array().map((e) => ({ field: e.path, message: e.msg }));
  return next(ApiError.badRequest('Validation failed', errors));
};

export default validate;
