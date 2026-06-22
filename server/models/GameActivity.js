import mongoose from "mongoose";

const gameActivitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    gameId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Game"
    },
    gameSlug: {
      type: String,
      index: true
    },
    gameName: String,
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GameRoom"
    },
    source: {
      type: String,
      enum: ["manual", "steam", "discord", "api", "demo"],
      default: "manual"
    },
    startedAt: {
      type: Date,
      default: Date.now
    },
    endedAt: Date,
    durationMinutes: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ["active", "completed", "cancelled"],
      default: "active",
      index: true
    },
    result: {
      type: String,
      enum: ["win", "loss", "completed", "unknown"],
      default: "unknown"
    },
    matchRating: Number,
    teamworkScore: Number,
    communicationScore: Number,
    reliabilityScore: Number,
    performanceScore: Number,
    notes: String
  },
  { timestamps: true }
);

gameActivitySchema.index({ userId: 1, gameSlug: 1, startedAt: -1 });

const GameActivity = mongoose.model("GameActivity", gameActivitySchema);

export default GameActivity;
