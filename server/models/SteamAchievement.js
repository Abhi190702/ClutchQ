import mongoose from "mongoose";

const steamAchievementSchema = new mongoose.Schema(
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
      index: true
    },
    appId: {
      type: Number,
      required: true,
      index: true
    },
    gameName: String,
    achievementName: String,
    displayName: String,
    description: String,
    icon: String,
    iconGray: String,
    achieved: {
      type: Boolean,
      default: false,
      index: true
    },
    unlockTime: Date,
    rarityPercent: Number,
    lastSyncedAt: Date
  },
  { timestamps: true }
);

steamAchievementSchema.index({ userId: 1, appId: 1, achievementName: 1 }, { unique: true });

const SteamAchievement = mongoose.model("SteamAchievement", steamAchievementSchema);

export default SteamAchievement;
