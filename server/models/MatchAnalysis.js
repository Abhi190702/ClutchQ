import mongoose from "mongoose";

const matchAnalysisSchema = new mongoose.Schema(
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
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GameRoom"
    },
    activityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GameActivity"
    },
    category: String,
    matchRating: Number,
    teamworkScore: Number,
    communicationScore: Number,
    reliabilityScore: Number,
    performanceScore: Number,
    trustImpact: Number,
    highlights: [String],
    improvementAreas: [String],
    sourceBreakdown: mongoose.Schema.Types.Mixed
  },
  { timestamps: true }
);

const MatchAnalysis = mongoose.model("MatchAnalysis", matchAnalysisSchema);

export default MatchAnalysis;
