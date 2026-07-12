import mongoose from "mongoose";

const otpTokenSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
      maxlength: 254
    },
    purpose: {
      type: String,
      enum: ["email_verification", "password_reset", "login_verification"],
      required: true
    },
    otpHash: {
      type: String,
      required: true,
      minlength: 64,
      maxlength: 64
    },
    attempts: {
      type: Number,
      default: 0,
      min: 0
    },
    maxAttempts: {
      type: Number,
      default: 5,
      min: 1,
      max: 20
    },
    consumedAt: Date,
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }
    },
    resendAvailableAt: Date,
    requestIp: { type: String, maxlength: 100 },
    userAgent: { type: String, maxlength: 500 },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { versionKey: false }
);

otpTokenSchema.index(
  { email: 1, purpose: 1 },
  { unique: true, partialFilterExpression: { consumedAt: null } }
);
otpTokenSchema.index({ consumedAt: 1 });
otpTokenSchema.index({ createdAt: -1 });

const OtpToken = mongoose.model("OtpToken", otpTokenSchema);

export default OtpToken;
