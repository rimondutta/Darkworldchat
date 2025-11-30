import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    otp: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      index: { expireAfterSeconds: 0 }, // Auto-delete after expiry
    },
  },
  { timestamps: true }
);

// Create a unique index on email to ensure one OTP per email
otpSchema.index({ email: 1 }, { unique: true });

const OTP = mongoose.model('OTP', otpSchema);

export default OTP;
