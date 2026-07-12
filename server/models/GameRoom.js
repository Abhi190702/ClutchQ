import mongoose from "mongoose";

const gameRoomMemberSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    role: { type: String, trim: true, maxlength: 50 },
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
    channelId: { type: String, trim: true, maxlength: 30 },
    channelName: { type: String, trim: true, maxlength: 100 },
    inviteUrl: { type: String, trim: true, maxlength: 300 },
    createdAt: Date,
    expiresAt: Date,
    provisioningToken: { type: String, maxlength: 64, select: false },
    provisioningStartedAt: { type: Date, select: false }
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
      required: true,
      trim: true,
      maxlength: 80,
      index: true
    },
    title: { type: String, required: true, trim: true, maxlength: 80 },
    hostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    mode: { type: String, trim: true, maxlength: 60 },
    region: { type: String, required: true, trim: true, maxlength: 80 },
    language: { type: String, required: true, trim: true, maxlength: 40 },
    rankMin: { type: String, trim: true, maxlength: 50 },
    rankMax: { type: String, trim: true, maxlength: 50 },
    micRequired: Boolean,
    maxMembers: {
      type: Number,
      default: 5,
      min: 2,
      max: 10
    },
    currentMembers: [gameRoomMemberSchema],
    neededRoles: [{ type: String, trim: true, maxlength: 50 }],
    tags: [{ type: String, trim: true, maxlength: 40 }],
    status: {
      type: String,
      enum: ["open", "full", "starting", "in_game", "completed", "cancelled"],
      default: "open",
      index: true
    },
    trustRequirement: {
      type: Number,
      default: 60,
      min: 0,
      max: 100
    },
    discord: {
      type: gameRoomDiscordSchema,
      default: undefined
    },
    startsAt: Date
  },
  { timestamps: true }
);

gameRoomSchema.index({ gameSlug: 1, status: 1, hostId: 1 });
gameRoomSchema.index({ gameSlug: 1, status: 1, createdAt: -1 });
gameRoomSchema.index({ "currentMembers.userId": 1, status: 1 });
gameRoomSchema.index({ status: 1, startsAt: 1 });
gameRoomSchema.index({ status: 1, "discord.channelId": 1 });

const GameRoom = mongoose.model("GameRoom", gameRoomSchema);

export default GameRoom;
