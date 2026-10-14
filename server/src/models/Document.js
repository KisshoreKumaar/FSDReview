import mongoose from 'mongoose';
import { DOCUMENT_TYPE_VALUES, VERIFICATION_STATUS } from '../constants/documents.js';

const documentSchema = new mongoose.Schema(
  {
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
      required: true,
      index: true,
    },
    type: { type: String, enum: DOCUMENT_TYPE_VALUES, required: true },
    originalName: String,
    url: { type: String, required: true },
    publicId: String,
    storageDriver: { type: String, enum: ['cloudinary', 'local'], default: 'local' },
    mimeType: String,
    sizeBytes: Number,
    verificationStatus: {
      type: String,
      enum: Object.values(VERIFICATION_STATUS),
      default: VERIFICATION_STATUS.PENDING,
      index: true,
    },
    rejectionReason: String,
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    verifiedAt: Date,
  },
  { timestamps: true },
);

documentSchema.index({ application: 1, type: 1 });

// Reuse an already-compiled model: test files share one mongoose registry.
export const Document = mongoose.models.Document || mongoose.model('Document', documentSchema);
export default Document;
