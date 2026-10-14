import mongoose from 'mongoose';
import { CATEGORIES } from '../constants/categories.js';

const entrySchema = new mongoose.Schema(
  {
    application: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true },
    applicationNo: String,
    applicantName: String,
    meritScore: Number,
    rank: Number,
    category: { type: String, enum: CATEGORIES },
    percentage: Number,
    subjectAverage: Number,
    allotted: { type: Boolean, default: false },
  },
  { _id: false },
);

const meritListSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    admissionCycle: { type: String, required: true },
    entries: { type: [entrySchema], default: [] },
    totalSeats: Number,
    seatsAllotted: Number,
    excludedCount: Number,
    generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    publishedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    publishedAt: Date,
    isPublished: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);

meritListSchema.index({ course: 1, admissionCycle: 1 });

// Reuse an already-compiled model: test files share one mongoose registry.
export const MeritList = mongoose.models.MeritList || mongoose.model('MeritList', meritListSchema);
export default MeritList;
