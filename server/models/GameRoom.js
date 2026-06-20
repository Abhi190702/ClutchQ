import mongoose from "mongoose";

const gameRoomMemberSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    role: String,
    joinedAt: {
      type: Date,
      default: Date.now
    },
    ready: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: ["joined", "invited", "left"],
      default: "joined"
    }
  },
  { _id: false }
);

const gameRoomDiscordSchema = new mongoose.Schema(
  {
    channelId: String,
    channelName: String,
    inviteUrl: String,
    createdAt: Date,
    expiresAt: Date
  },
  { _id: false }
);

const gameRoomSchema = new mongoose.Schema(
  {
    gameId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Game"
    },
    gameSlug: {
      type: String,
      index: true
    },
    title: String,
    hostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    mode: String,
    region: String,
    language: String,
    rankMin: String,
    rankMax: String,
    micRequired: Boolean,
    maxMembers: {
      type: Number,
      default: 5
    },
    currentMembers: [gameRoomMemberSchema],
    neededRoles: [String],
    tags: [String],
    status: {
      type: String,
      enum: ["open", "starting", "in_game", "completed", "cancelled"],
      default: "open",
      index: true
    },
    trustRequirement: {
      type: Number,
      default: 60
    },
    discord: {
      type: gameRoomDiscordSchema,
      default: undefined
    },
    startsAt: Date
  },
  { timestamps: true }
);

const GameRoom = mongoose.model("GameRoom", gameRoomSchema);

export default GameRoom;
