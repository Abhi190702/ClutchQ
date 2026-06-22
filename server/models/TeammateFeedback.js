import mongoose from "mongoose";

const teammateFeedbackSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GameActivity",
      required: true,
      index: true
    },
    lobbyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lobby"
    },
    fromUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    toUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    ratings: {
      communication: Number,
      teamwork: Number,
      reliability: Number,
      skill: Number,
      behavior: Number
    },
    wouldPlayAgain: {
      type: String,
      enum: ["yes", "maybe", "no", "skipped"],
      default: "skipped"
    },
    comment: String,
    skipped: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

teammateFeedbackSchema.index({ sessionId: 1, fromUserId: 1, toUserId: 1 }, { unique: true });
teammateFeedbackSchema.index({ toUserId: 1, createdAt: -1 });

const TeammateFeedback = mongoose.model("TeammateFeedback", teammateFeedbackSchema);

export default TeammateFeedback;
