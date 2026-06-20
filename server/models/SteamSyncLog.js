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
      index: true
    },
    syncType: {
      type: String,
      default: "full"
    },
    status: {
      type: String,
      enum: ["running", "success", "partial", "failed"],
      default: "running",
      index: true
    },
    message: String,
    startedAt: {
      type: Date,
      default: Date.now
    },
    finishedAt: Date,
    counts: {
      games: { type: Number, default: 0 },
      achievements: { type: Number, default: 0 },
      friends: { type: Number, default: 0 },
      recentGames: { type: Number, default: 0 }
    },
    privateSections: [String]
  },
  { timestamps: true }
);

const SteamSyncLog = mongoose.model("SteamSyncLog", steamSyncLogSchema);

export default SteamSyncLog;
