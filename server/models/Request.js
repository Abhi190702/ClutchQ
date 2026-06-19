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
    message: String
  },
  { timestamps: true }
);

const Request = mongoose.model("Request", requestSchema);

export default Request;
