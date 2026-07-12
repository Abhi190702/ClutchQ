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
    activityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GameActivity"
    },
    category: { type: String, trim: true, maxlength: 80 },
    matchRating: { type: Number, min: 0, max: 100 },
    teamworkScore: { type: Number, min: 0, max: 100 },
    communicationScore: { type: Number, min: 0, max: 100 },
    reliabilityScore: { type: Number, min: 0, max: 100 },
    performanceScore: { type: Number, min: 0, max: 100 },
    trustImpact: { type: Number, min: -100, max: 100 },
    highlights: [{ type: String, maxlength: 300 }],
    improvementAreas: [{ type: String, maxlength: 300 }],
    sourceBreakdown: mongoose.Schema.Types.Mixed
  },
  { timestamps: true }
);

matchAnalysisSchema.index(
  { activityId: 1 },
  { unique: true, partialFilterExpression: { activityId: { $type: "objectId" } } }
);

const MatchAnalysis = mongoose.model("MatchAnalysis", matchAnalysisSchema);

export default MatchAnalysis;
