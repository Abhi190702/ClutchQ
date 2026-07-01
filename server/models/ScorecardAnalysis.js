import mongoose from "mongoose";

const scorecardAnalysisSchema = new mongoose.Schema(
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
    uploadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ScorecardUpload"
    },
    gameSlug: {
      type: String,
      index: true
    },
    gameName: String,
    detectedGame: String,
    gameType: String,
    extractedStats: mongoose.Schema.Types.Mixed,
    performance: mongoose.Schema.Types.Mixed,
    situationalSignals: mongoose.Schema.Types.Mixed,
    summary: [String],
    warnings: [String],
    confidence: {
      type: Number,
      min: 0,
      max: 1
    },
    source: {
      type: String,
      enum: ["python", "fallback", "demo"],
      default: "fallback"
    }
  },
  { timestamps: true }
);

scorecardAnalysisSchema.index({ userId: 1, sessionId: 1, createdAt: -1 });
scorecardAnalysisSchema.index({ userId: 1, sessionId: 1, gameSlug: 1 });
scorecardAnalysisSchema.index({ userId: 1, gameSlug: 1, createdAt: -1 });

const ScorecardAnalysis = mongoose.model("ScorecardAnalysis", scorecardAnalysisSchema);

export default ScorecardAnalysis;
