import mongoose from "mongoose";

const memberSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    role: { type: String, trim: true, maxlength: 50 },
    ready: {
      type: Boolean,
      default: false
    }
  },
  { _id: false }
);

const discordRoomSchema = new mongoose.Schema(
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

const lobbySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    game: { type: String, required: true, trim: true, maxlength: 100 },
    rankMin: { type: String, trim: true, maxlength: 50 },
    rankMax: { type: String, trim: true, maxlength: 50 },
    rankMinValue: Number,
    rankMaxValue: Number,
    region: { type: String, required: true, trim: true, maxlength: 80 },
    language: { type: String, required: true, trim: true, maxlength: 40 },
    micRequired: Boolean,
    neededPlayers: { type: Number, required: true, default: 4, min: 2, max: 10 },
    neededRoles: [{ type: String, trim: true, maxlength: 50 }],
    currentMembers: [memberSchema],
    pendingRequests: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Request"
      }
    ],
    status: {
      type: String,
      enum: ["open", "full", "closed"],
      default: "open"
    },
    mode: {
      type: String,
      enum: ["competitive", "casual", "scrim", "tournament"],
      default: "competitive"
    },
    startTime: Date,
    description: { type: String, trim: true, maxlength: 500 },
    inviteCode: { type: String, trim: true, maxlength: 20, index: true },
    discord: {
      type: discordRoomSchema,
      default: undefined
    }
  },
  { timestamps: true }
);

lobbySchema.index({ ownerId: 1, status: 1, game: 1 });
lobbySchema.index({ game: 1, status: 1, createdAt: -1 });
lobbySchema.index({ "currentMembers.userId": 1, status: 1 });
lobbySchema.index({ status: 1, startTime: 1 });
lobbySchema.index({ status: 1, "discord.channelId": 1 });

const Lobby = mongoose.model("Lobby", lobbySchema);

export default Lobby;
