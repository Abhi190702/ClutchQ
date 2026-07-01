import mongoose from "mongoose";

const gameplayGraphSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    gameplayProfileScore: {
      type: Number,
      index: true
    },
    confidence: Number,
    style: mongoose.Schema.Types.Mixed,
    gameProfiles: [mongoose.Schema.Types.Mixed],
    situationalStrengths: [mongoose.Schema.Types.Mixed],
    teammateEdges: [mongoose.Schema.Types.Mixed],
    recommendations: [String],
    rhythmSummary: mongoose.Schema.Types.Mixed,
    lastBuiltAt: {
      type: Date,
      index: true
    },
    source: {
      type: String,
      enum: ["python", "fallback", "demo"],
      default: "fallback"
    }
  },
  { timestamps: true }
);

gameplayGraphSchema.index({ userId: 1 }, { unique: true });

const GameplayGraph = mongoose.model("GameplayGraph", gameplayGraphSchema);

export default GameplayGraph;
