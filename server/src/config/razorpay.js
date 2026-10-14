import Razorpay from 'razorpay';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

export const isRazorpayConfigured = Boolean(env.razorpay.keyId && env.razorpay.keySecret);

export const razorpay = isRazorpayConfigured
  ? new Razorpay({ key_id: env.razorpay.keyId, key_secret: env.razorpay.keySecret })
  : null;

if (!isRazorpayConfigured) {
  logger.warn('Razorpay keys absent — payments run in mock mode (no real gateway calls)');
}

export default razorpay;
