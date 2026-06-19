import mongoose from "mongoose";

const sessionMemberSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    role: String,
    didShow: {
      type: Boolean,
      default: true
    }
  },
  { _id: false }
);

const sessionSchema = new mongoose.Schema(
  {
    lobbyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lobby"
    },
    game: String,
    mode: String,
    members: [sessionMemberSchema],
    chemistryScore: Number,
    result: {
      type: String,
      enum: ["won", "lost", "scrim", "cancelled"],
      default: "scrim"
    },
    startedAt: Date,
    endedAt: Date,
    notes: String
  },
  { timestamps: true }
);

const Session = mongoose.model("Session", sessionSchema);

export default Session;
