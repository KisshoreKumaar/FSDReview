import { Application } from '../models/Application.js';
import { Payment } from '../models/Payment.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/apiResponse.js';
import { logger } from '../utils/logger.js';
import { notify } from '../services/notify.js';
import {
  applicationFee,
  createOrder,
  isRazorpayConfigured,
  verifyCheckoutSignature,
  verifyWebhookSignature,
} from '../services/payment.js';

const markPaid = async (payment, { paymentId, signature, method }) => {
  if (payment.status === 'PAID') return payment;
  payment.status = 'PAID';
  payment.razorpayPaymentId = paymentId;
  payment.razorpaySignature = signature;
  payment.method = method;
  payment.paidAt = new Date();
  await payment.save();

  await Application.findByIdAndUpdate(payment.application, { payment: payment._id });
  await notify(payment.applicant, {
    title: 'Application fee received',
    body: `We have received ₹${(payment.amount / 100).toFixed(2)}. Your payment reference is ${paymentId}.`,
    link: '/app/payment',
  });
  return payment;
};

export const createPaymentOrder = asyncHandler(async (req, res) => {
  const application = await Application.findOne({
    applicant: req.user._id,
    admissionCycle: env.admissionCycle,
  });
  if (!application) throw ApiError.badRequest('Start your application before paying the fee');

  const existing = await Payment.findOne({ application: application._id, status: 'PAID' });
  if (existing) return ok(res, { payment: existing, alreadyPaid: true }, 'Fee already paid');

  const amount = applicationFee();
  const order = await createOrder({
    amount,
    receipt: application.applicationNo,
    notes: { applicationNo: application.applicationNo },
  });

  const payment = await Payment.create({
    application: application._id,
    applicant: req.user._id,
    razorpayOrderId: order.id,
    amount,
    currency: 'INR',
    status: 'CREATED',
    isMock: Boolean(order.isMock),
  });

  return ok(
    res,
    {
      payment,
      order: { id: order.id, amount, currency: 'INR' },
      keyId: env.razorpay.keyId || null,
      mockMode: !isRazorpayConfigured,
    },
    'Payment order created',
  );
});

export const getMyPayment = asyncHandler(async (req, res) => {
  const application = await Application.findOne({
    applicant: req.user._id,
    admissionCycle: env.admissionCycle,
  }).select('_id applicationNo');
  if (!application) return ok(res, { payment: null, fee: applicationFee() }, 'No application yet');

  const payment = await Payment.findOne({ application: application._id }).sort({ createdAt: -1 });
  return ok(res, { payment, fee: applicationFee(), mockMode: !isRazorpayConfigured }, 'Payment fetched');
});

/** Called by the browser after Razorpay checkout (or by the mock "Pay now" button). */
export const confirmPayment = asyncHandler(async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
  const payment = await Payment.findOne({ razorpayOrderId, applicant: req.user._id });
  if (!payment) throw ApiError.notFound('Payment order not found');

  if (payment.isMock) {
    await markPaid(payment, { paymentId: `pay_mock_${Date.now()}`, signature: 'mock', method: 'mock' });
    return ok(res, { payment }, 'Payment confirmed (mock gateway)');
  }

  const valid = verifyCheckoutSignature({
    orderId: razorpayOrderId,
    paymentId: razorpayPaymentId,
    signature: razorpaySignature,
  });
  if (!valid) {
    payment.status = 'FAILED';
    await payment.save();
    throw ApiError.badRequest('Payment signature verification failed');
  }

  await markPaid(payment, {
    paymentId: razorpayPaymentId,
    signature: razorpaySignature,
    method: 'razorpay',
  });
  return ok(res, { payment }, 'Payment confirmed');
});

/** Razorpay → server. Signature is checked against the raw request body. */
export const handleWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const raw = req.rawBody || Buffer.from(JSON.stringify(req.body));
  if (!verifyWebhookSignature(raw, signature)) {
    logger.warn('Rejected Razorpay webhook with an invalid signature');
    throw ApiError.badRequest('Invalid webhook signature');
  }

  const event = req.body?.event;
  const entity = req.body?.payload?.payment?.entity;
  if (!entity?.order_id) return ok(res, null, 'Ignored');

  const payment = await Payment.findOne({ razorpayOrderId: entity.order_id });
  if (!payment) return ok(res, null, 'Unknown order');

  if (event === 'payment.captured') {
    await markPaid(payment, { paymentId: entity.id, signature, method: entity.method });
  } else if (event === 'payment.failed') {
    payment.status = 'FAILED';
    await payment.save();
  }

  logger.info(`Razorpay webhook handled: ${event} for ${entity.order_id}`);
  return ok(res, null, 'Webhook processed');
});
