import { logger } from '../utils/logger.js';
import { ApiError } from '../utils/ApiError.js';

export const notFoundHandler = (req, res, next) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};

/* eslint-disable no-unused-vars */
export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let errors = err.errors;

  if (err.name === 'ValidationError' && err.errors) {
    statusCode = 400;
    message = 'Validation failed';
    errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid value for ${err.path}`;
  } else if (err.code === 11000) {
    statusCode = 409;
    message = `Duplicate value for ${Object.keys(err.keyValue || {}).join(', ')}`;
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (err.name === 'MulterError') {
    statusCode = 400;
    message = err.code === 'LIMIT_FILE_SIZE' ? 'File exceeds the 5 MB limit' : err.message;
  }

  if (statusCode >= 500) logger.error(err.stack || err);
  else logger.warn(`${statusCode} ${req.method} ${req.originalUrl} — ${message}`);

  res.status(statusCode).json({ success: false, message, ...(errors ? { errors } : {}) });
};

export default errorHandler;
