import mongoose from "mongoose";

const sessionMemberSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    role: { type: String, trim: true, maxlength: 50 },
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
    game: { type: String, required: true, trim: true, maxlength: 100 },
    mode: { type: String, trim: true, maxlength: 60 },
    members: [sessionMemberSchema],
    chemistryScore: { type: Number, min: 0, max: 100 },
    result: {
      type: String,
      enum: ["won", "lost", "scrim", "cancelled"],
      default: "scrim"
    },
    startedAt: { type: Date, required: true },
    endedAt: Date,
    notes: { type: String, trim: true, maxlength: 1000 }
  },
  { timestamps: true }
);

sessionSchema.index(
  { lobbyId: 1 },
  { unique: true, partialFilterExpression: { lobbyId: { $type: "objectId" } } }
);

const Session = mongoose.model("Session", sessionSchema);

export default Session;
