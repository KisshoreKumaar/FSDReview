import crypto from 'node:crypto';
import { razorpay, isRazorpayConfigured } from '../config/razorpay.js';
import { env } from '../config/env.js';

/** Creates a gateway order, or a deterministic mock one when keys are absent. */
export const createOrder = async ({ amount, receipt, notes }) => {
  if (!isRazorpayConfigured) {
    return {
      id: `order_mock_${crypto.randomBytes(8).toString('hex')}`,
      amount,
      currency: 'INR',
      receipt,
      isMock: true,
    };
  }

  const order = await razorpay.orders.create({
    amount,
    currency: 'INR',
    receipt,
    notes,
    payment_capture: 1,
  });
  return { ...order, isMock: false };
};

/** Checkout callback signature: HMAC(order_id|payment_id, key_secret). */
export const verifyCheckoutSignature = ({ orderId, paymentId, signature }) => {
  if (!isRazorpayConfigured) return true;
  const expected = crypto
    .createHmac('sha256', env.razorpay.keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(String(signature || '')));
};

/** Webhook signature: HMAC(rawBody, webhook_secret). */
export const verifyWebhookSignature = (rawBody, signature) => {
  if (!env.razorpay.webhookSecret) return false;
  const expected = crypto
    .createHmac('sha256', env.razorpay.webhookSecret)
    .update(rawBody)
    .digest('hex');
  const received = Buffer.from(String(signature || ''));
  const expectedBuf = Buffer.from(expected);
  return received.length === expectedBuf.length && crypto.timingSafeEqual(expectedBuf, received);
};

export const applicationFee = () => env.razorpay.feePaise;
export { isRazorpayConfigured };
