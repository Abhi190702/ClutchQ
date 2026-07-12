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
      index: true,
      match: /^\d{17}$/
    },
    appId: {
      type: Number,
      required: true,
      index: true,
      min: 1
    },
    gameName: { type: String, trim: true, maxlength: 200 },
    achievementName: { type: String, required: true, trim: true, maxlength: 200 },
    displayName: { type: String, trim: true, maxlength: 240 },
    description: { type: String, trim: true, maxlength: 1200 },
    icon: { type: String, maxlength: 600 },
    iconGray: { type: String, maxlength: 600 },
    achieved: {
      type: Boolean,
      default: false,
      index: true
    },
    unlockTime: Date,
    rarityPercent: { type: Number, min: 0, max: 100 },
    lastSyncedAt: Date
  },
  { timestamps: true }
);

steamAchievementSchema.index({ userId: 1, appId: 1, achievementName: 1 }, { unique: true });

const SteamAchievement = mongoose.model("SteamAchievement", steamAchievementSchema);

export default SteamAchievement;
