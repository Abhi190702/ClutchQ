import mongoose from "mongoose";

const gamePlaytimeAggregateSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    gameSlug: {
      type: String,
      index: true
    },
    gameName: String,
    totalMinutes: {
      type: Number,
      default: 0
    },
    weeklyMinutes: {
      type: Number,
      default: 0
    },
    monthlyMinutes: {
      type: Number,
      default: 0
    },
    sessionsCount: {
      type: Number,
      default: 0
    },
    lastPlayedAt: Date
  },
  { timestamps: true }
);

gamePlaytimeAggregateSchema.index({ userId: 1, gameSlug: 1 }, { unique: true });

const GamePlaytimeAggregate = mongoose.model("GamePlaytimeAggregate", gamePlaytimeAggregateSchema);

export default GamePlaytimeAggregate;
