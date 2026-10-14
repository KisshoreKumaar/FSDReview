import mongoose from 'mongoose';
import { STATUS, STATUS_VALUES } from '../constants/status.js';
import { CATEGORIES } from '../constants/categories.js';

const subjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    maxMarks: { type: Number, required: true, min: 1 },
    obtained: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const historySchema = new mongoose.Schema(
  {
    from: { type: String, enum: [...STATUS_VALUES, 'NEW'] },
    to: { type: String, enum: STATUS_VALUES, required: true },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    remarks: String,
    at: { type: Date, default: Date.now },
  },
  { _id: false },
);

const preferenceSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    priority: { type: Number, required: true, min: 1, max: 5 },
  },
  { _id: false },
);

const applicationSchema = new mongoose.Schema(
  {
    applicationNo: { type: String, unique: true, index: true },
    applicant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    coursePreferences: { type: [preferenceSchema], default: [] },
    personal: {
      fatherName: String,
      motherName: String,
      dob: Date,
      gender: { type: String, enum: ['MALE', 'FEMALE', 'OTHER'] },
      category: { type: String, enum: CATEGORIES },
      nationality: { type: String, default: 'Indian' },
    },
    address: {
      line1: String,
      line2: String,
      city: String,
      state: String,
      pincode: String,
    },
    academics: {
      board: String,
      schoolName: String,
      yearOfPassing: Number,
      subjects: { type: [subjectSchema], default: [] },
      percentage: { type: Number, min: 0, max: 100 },
    },
    documents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Document' }],
    payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
    status: { type: String, enum: STATUS_VALUES, default: STATUS.DRAFT, index: true },
    statusHistory: { type: [historySchema], default: [] },
    assignedOfficer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    meritScore: Number,
    meritRank: Number,
    admissionCycle: { type: String, index: true },
    submittedAt: Date,
  },
  { timestamps: true },
);

applicationSchema.index({ status: 1, assignedOfficer: 1 });

applicationSchema.methods.pushHistory = function pushHistory({ from, to, changedBy, remarks }) {
  this.statusHistory.push({ from: from || 'NEW', to, changedBy, remarks, at: new Date() });
};

// Reuse an already-compiled model: test files share one mongoose registry.
export const Application = mongoose.models.Application || mongoose.model('Application', applicationSchema);
export default Application;
