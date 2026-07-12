import mongoose from "mongoose";

const steamSyncLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    steamId: {
      type: String,
      index: true,
      match: /^\d{17}$/
    },
    syncType: {
      type: String,
      enum: ["full", "demo"],
      default: "full"
    },
    status: {
      type: String,
      enum: ["running", "success", "partial", "failed"],
      default: "running",
      index: true
    },
    message: { type: String, trim: true, maxlength: 500 },
    startedAt: {
      type: Date,
      default: Date.now
    },
    finishedAt: Date,
    counts: {
      games: { type: Number, default: 0, min: 0 },
      achievements: { type: Number, default: 0, min: 0 },
      friends: { type: Number, default: 0, min: 0 },
      recentGames: { type: Number, default: 0, min: 0 }
    },
    privateSections: [{ type: String, maxlength: 80 }],
    warnings: [{ type: String, maxlength: 500 }]
  },
  { timestamps: true }
);

steamSyncLogSchema.index({ userId: 1, startedAt: -1 });
steamSyncLogSchema.index({ status: 1, startedAt: -1 });
steamSyncLogSchema.index(
  { userId: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: "running" } }
);

const SteamSyncLog = mongoose.model("SteamSyncLog", steamSyncLogSchema);

export default SteamSyncLog;
