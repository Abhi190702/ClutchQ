import mongoose from "mongoose";

const otpTokenSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true
    },
    purpose: {
      type: String,
      enum: ["email_verification", "password_reset", "login_verification"],
      required: true
    },
    otpHash: {
      type: String,
      required: true
    },
    attempts: {
      type: Number,
      default: 0
    },
    maxAttempts: {
      type: Number,
      default: 5
    },
    consumedAt: Date,
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }
    },
    resendAvailableAt: Date,
    requestIp: String,
    userAgent: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { versionKey: false }
);

otpTokenSchema.index({ email: 1, purpose: 1 });
otpTokenSchema.index({ consumedAt: 1 });
otpTokenSchema.index({ createdAt: -1 });

const OtpToken = mongoose.model("OtpToken", otpTokenSchema);

export default OtpToken;
