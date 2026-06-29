import mongoose from "mongoose";

const scorecardUploadSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GameActivity",
      index: true
    },
    lobbyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lobby"
    },
    gameSlug: {
      type: String,
      index: true
    },
    gameName: String,
    imageDataUrl: String,
    imageMime: {
      type: String,
      enum: ["", "image/jpeg", "image/png", "image/webp"],
      default: ""
    },
    imageSizeBytes: {
      type: Number,
      min: 0,
      max: 900 * 1024,
      default: 0
    },
    status: {
      type: String,
      enum: ["pending", "processed", "failed"],
      default: "pending",
      index: true
    },
    source: {
      type: String,
      enum: ["user_upload", "demo"],
      default: "user_upload"
    },
    processedAt: Date,
    errorMessage: String
  },
  { timestamps: true }
);

scorecardUploadSchema.index({ userId: 1, sessionId: 1 });
scorecardUploadSchema.index({ userId: 1, gameSlug: 1, createdAt: -1 });
scorecardUploadSchema.index({ status: 1, createdAt: -1 });

const ScorecardUpload = mongoose.model("ScorecardUpload", scorecardUploadSchema);

export default ScorecardUpload;
