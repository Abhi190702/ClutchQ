import mongoose from "mongoose";

const passwordResetSessionSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
      maxlength: 254
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      minlength: 64,
      maxlength: 64
    },
    consumedAt: Date,
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }
    },
    requestIp: { type: String, maxlength: 100 },
    userAgent: { type: String, maxlength: 500 },
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
