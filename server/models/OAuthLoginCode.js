import mongoose from "mongoose";

const oauthLoginCodeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    codeHash: {
      type: String,
      required: true,
      unique: true,
      minlength: 64,
      maxlength: 64
    },
    purpose: {
      type: String,
      enum: ["login", "link"],
      default: "login",
      required: true
    },
    provider: {
      type: String,
      enum: ["google", "discord", "steam"],
      required() {
        return this.purpose === "link";
      }
    },
    tokenVersion: {
      type: Number,
      default: 0,
      min: 0
    },
    consumedAt: Date,
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }
    }
  },
  { timestamps: true }
);

oauthLoginCodeSchema.index({ userId: 1, purpose: 1, consumedAt: 1 });

const OAuthLoginCode = mongoose.model("OAuthLoginCode", oauthLoginCodeSchema);

export default OAuthLoginCode;
