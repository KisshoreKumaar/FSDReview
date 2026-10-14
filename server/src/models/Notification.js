import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    link: String,
    channel: { type: String, enum: ['IN_APP', 'EMAIL'], default: 'IN_APP' },
    isRead: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

// Reuse an already-compiled model: test files share one mongoose registry.
export const Notification = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
export default Notification;
