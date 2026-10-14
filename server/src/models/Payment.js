import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
      required: true,
      index: true,
    },
    applicant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    razorpayOrderId: { type: String, index: true },
    razorpayPaymentId: String,
    razorpaySignature: String,
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: {
      type: String,
      enum: ['CREATED', 'PAID', 'FAILED', 'REFUNDED'],
      default: 'CREATED',
      index: true,
    },
    method: String,
    isMock: { type: Boolean, default: false },
    paidAt: Date,
  },
  { timestamps: true },
);

// Reuse an already-compiled model: test files share one mongoose registry.
export const Payment = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);
export default Payment;
