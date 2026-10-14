import { Router } from 'express';
import { body } from 'express-validator';
import * as controller from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { authLimiter, otpLimiter } from '../middleware/rateLimit.js';

export const authRouter = Router();

const emailRule = body('email').isEmail().withMessage('A valid email is required').normalizeEmail();

authRouter.post(
  '/register',
  authLimiter,
  [
    body('name').trim().isLength({ min: 3, max: 120 }).withMessage('Name must be 3–120 characters'),
    emailRule,
    body('phone').matches(/^[6-9]\d{9}$/).withMessage('Enter a valid 10-digit Indian mobile number'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/[A-Za-z]/)
      .withMessage('Password must contain a letter')
      .matches(/\d/)
      .withMessage('Password must contain a digit'),
  ],
  validate,
  controller.register,
);

authRouter.post(
  '/verify-otp',
  otpLimiter,
  [emailRule, body('code').isLength({ min: 6, max: 6 }).withMessage('Enter the 6-digit code')],
  validate,
  controller.verifyOtp,
);

authRouter.post('/resend-otp', otpLimiter, [emailRule], validate, controller.resendOtp);

authRouter.post(
  '/login',
  authLimiter,
  [emailRule, body('password').notEmpty().withMessage('Password is required')],
  validate,
  controller.login,
);

authRouter.post('/refresh', controller.refresh);
authRouter.post('/logout', controller.logout);
authRouter.get('/me', authenticate, controller.me);

export default authRouter;
