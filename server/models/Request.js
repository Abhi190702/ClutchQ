import mongoose from "mongoose";

const requestSchema = new mongoose.Schema(
  {
    fromUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    toUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    lobbyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lobby"
    },
    type: {
      type: String,
      enum: ["teammate", "lobby"],
      required: true
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "cancelled"],
      default: "pending"
    },
    message: { type: String, trim: true, maxlength: 500 }
  },
  { timestamps: true }
);

requestSchema.index({ fromUser: 1, toUser: 1, status: 1 });
requestSchema.index({ lobbyId: 1, status: 1 });
requestSchema.index({ status: 1, createdAt: 1, lobbyId: 1 });
requestSchema.index(
  { fromUser: 1, toUser: 1, lobbyId: 1, type: 1 },
  { unique: true, partialFilterExpression: { status: "pending" } }
);

const Request = mongoose.model("Request", requestSchema);

export default Request;
