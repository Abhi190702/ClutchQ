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
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GameRoom"
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
      communication: { type: Number, min: 1, max: 5 },
      teamwork: { type: Number, min: 1, max: 5 },
      reliability: { type: Number, min: 1, max: 5 },
      skill: { type: Number, min: 1, max: 5 },
      behavior: { type: Number, min: 1, max: 5 }
    },
    wouldPlayAgain: {
      type: String,
      enum: ["yes", "maybe", "no", "skipped"],
      default: "skipped"
    },
    comment: {
      type: String,
      maxlength: 500
    },
    skipped: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

teammateFeedbackSchema.index({ sessionId: 1, fromUserId: 1, toUserId: 1 }, { unique: true });
teammateFeedbackSchema.index({ toUserId: 1, createdAt: -1 });
teammateFeedbackSchema.index({ roomId: 1, createdAt: -1 });

const TeammateFeedback = mongoose.model("TeammateFeedback", teammateFeedbackSchema);

export default TeammateFeedback;
