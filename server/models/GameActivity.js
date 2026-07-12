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
      required: true,
      trim: true,
      maxlength: 80,
      index: true
    },
    gameName: { type: String, required: true, trim: true, maxlength: 200 },
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
      default: 0,
      min: 0
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
    matchRating: { type: Number, min: 0, max: 100 },
    teamworkScore: { type: Number, min: 0, max: 100 },
    communicationScore: { type: Number, min: 0, max: 100 },
    reliabilityScore: { type: Number, min: 0, max: 100 },
    performanceScore: { type: Number, min: 0, max: 100 },
    notes: { type: String, maxlength: 500 }
  },
  { timestamps: true }
);

gameActivitySchema.index({ userId: 1, gameSlug: 1, startedAt: -1 });
gameActivitySchema.index({ status: 1, startedAt: 1 });
gameActivitySchema.index(
  { userId: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: "active" } }
);

const GameActivity = mongoose.model("GameActivity", gameActivitySchema);

export default GameActivity;
