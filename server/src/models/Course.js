import mongoose from 'mongoose';

const cutOffSchema = new mongoose.Schema(
  {
    general: { type: Number, default: 0, min: 0, max: 100 },
    obc: { type: Number, default: 0, min: 0, max: 100 },
    sc: { type: Number, default: 0, min: 0, max: 100 },
    st: { type: Number, default: 0, min: 0, max: 100 },
  },
  { _id: false },
);

const eligibilitySchema = new mongoose.Schema(
  {
    minPercentage: { type: Number, default: 50, min: 0, max: 100 },
    requiredSubjects: { type: [String], default: [] },
  },
  { _id: false },
);

const courseSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    department: { type: String, required: true, trim: true, index: true },
    degreeLevel: { type: String, enum: ['UG', 'PG'], required: true, index: true },
    durationYears: { type: Number, required: true, min: 1, max: 6 },
    totalSeats: { type: Number, required: true, min: 1 },
    seatsFilled: { type: Number, default: 0, min: 0 },
    eligibility: { type: eligibilitySchema, default: () => ({}) },
    cutOff: { type: cutOffSchema, default: () => ({}) },
    admissionCycle: { type: String, required: true, index: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

courseSchema.virtual('seatsAvailable').get(function seatsAvailable() {
  return Math.max(0, this.totalSeats - this.seatsFilled);
});

courseSchema.virtual('fillRate').get(function fillRate() {
  return this.totalSeats ? Math.round((this.seatsFilled / this.totalSeats) * 100) : 0;
});

courseSchema.index({ department: 1, degreeLevel: 1 });

// Reuse an already-compiled model: test files share one mongoose registry.
export const Course = mongoose.models.Course || mongoose.model('Course', courseSchema);
export default Course;
