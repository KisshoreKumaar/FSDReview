import { Router } from 'express';
import * as controller from '../controllers/payment.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import { ROLES } from '../constants/roles.js';

export const paymentRouter = Router();

// Razorpay calls this one — no session, signature-verified instead.
paymentRouter.post('/webhook', controller.handleWebhook);

paymentRouter.use(authenticate, requireRole(ROLES.APPLICANT));
paymentRouter.get('/mine', controller.getMyPayment);
paymentRouter.post('/order', controller.createPaymentOrder);
paymentRouter.post('/confirm', controller.confirmPayment);

export default paymentRouter;
