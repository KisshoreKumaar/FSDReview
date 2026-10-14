import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { ROLES, ROLE_VALUES } from '../constants/roles.js';
import { env } from '../config/env.js';

const otpSchema = new mongoose.Schema(
  {
    code: String,
    expiresAt: Date,
  },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: true, select: false },
    phone: { type: String, required: true, trim: true, match: /^[6-9]\d{9}$/ },
    role: { type: String, enum: ROLE_VALUES, default: ROLES.APPLICANT, index: true },
    isEmailVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    otp: { type: otpSchema, select: false },
    refreshTokenHash: { type: String, select: false },
    // Previous token stays valid for a few seconds so concurrent refreshes
    // (two tabs, React StrictMode) do not log the user out.
    previousRefreshTokenHash: { type: String, select: false },
    refreshRotatedAt: { type: Date, select: false },
    lastLoginAt: Date,
  },
  { timestamps: true },
);

userSchema.methods.setPassword = async function setPassword(plain) {
  this.passwordHash = await bcrypt.hash(plain, env.bcryptRounds);
};

userSchema.methods.verifyPassword = function verifyPassword(plain) {
  return bcrypt.compare(plain, this.passwordHash || '');
};

userSchema.methods.toPublic = function toPublic() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    phone: this.phone,
    role: this.role,
    isEmailVerified: this.isEmailVerified,
    createdAt: this.createdAt,
  };
};

// Reuse an already-compiled model: test files share one mongoose registry.
export const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;
