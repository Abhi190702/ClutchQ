import mongoose from "mongoose";

const passwordResetSessionSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true
    },
    tokenHash: {
      type: String,
      required: true,
      index: true
    },
    consumedAt: Date,
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }
    },
    requestIp: String,
    userAgent: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { versionKey: false }
);

passwordResetSessionSchema.index({ email: 1, consumedAt: 1 });
passwordResetSessionSchema.index({ createdAt: -1 });

const PasswordResetSession = mongoose.model("PasswordResetSession", passwordResetSessionSchema);

export default PasswordResetSession;
