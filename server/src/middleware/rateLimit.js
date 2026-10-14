import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

const base = {
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.isTest,
  message: { success: false, message: 'Too many requests, please try again later' },
};

export const authLimiter = rateLimit({ ...base, windowMs: 15 * 60 * 1000, max: 30 });

export const otpLimiter = rateLimit({ ...base, windowMs: 10 * 60 * 1000, max: 10 });

export const apiLimiter = rateLimit({ ...base, windowMs: 60 * 1000, max: 300 });
