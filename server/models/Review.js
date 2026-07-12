import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    reviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    reviewedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session"
    },
    communication: { type: Number, required: true, min: 1, max: 5 },
    teamwork: { type: Number, required: true, min: 1, max: 5 },
    skill: { type: Number, required: true, min: 1, max: 5 },
    punctuality: { type: Number, required: true, min: 1, max: 5 },
    behavior: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, maxlength: 500 }
  },
  { timestamps: true }
);

reviewSchema.index({ reviewerId: 1, reviewedUserId: 1, sessionId: 1 }, { unique: true });
reviewSchema.index({ reviewedUserId: 1, createdAt: -1 });

const Review = mongoose.model("Review", reviewSchema);

export default Review;
