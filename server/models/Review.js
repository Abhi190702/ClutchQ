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
    communication: Number,
    teamwork: Number,
    skill: Number,
    punctuality: Number,
    behavior: Number,
    comment: String
  },
  { timestamps: true }
);

const Review = mongoose.model("Review", reviewSchema);

export default Review;
