import mongoose from "mongoose";

const steamGameSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    steamId: {
      type: String,
      required: true,
      index: true,
      match: /^\d{17}$/
    },
    appId: {
      type: Number,
      required: true,
      min: 1
    },
    name: { type: String, trim: true, maxlength: 200 },
    iconUrl: { type: String, maxlength: 600 },
    logoUrl: { type: String, maxlength: 600 },
    playtimeForeverMinutes: {
      type: Number,
      default: 0,
      min: 0
    },
    playtimeLastTwoWeeksMinutes: {
      type: Number,
      default: 0,
      min: 0
    },
    lastPlayedAt: Date,
    hasCommunityVisibleStats: Boolean,
    source: {
      type: String,
      enum: ["steam", "demo"],
      default: "steam"
    },
    lastSyncedAt: Date
  },
  { timestamps: true }
);

steamGameSchema.index({ userId: 1, appId: 1 }, { unique: true });
steamGameSchema.index({ userId: 1, playtimeForeverMinutes: -1 });

const SteamGame = mongoose.model("SteamGame", steamGameSchema);

export default SteamGame;
