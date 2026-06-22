import mongoose from "mongoose";

const memberSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    role: String,
    ready: {
      type: Boolean,
      default: false
    }
  },
  { _id: false }
);

const discordRoomSchema = new mongoose.Schema(
  {
    channelId: String,
    channelName: String,
    inviteUrl: String,
    createdAt: Date,
    expiresAt: Date
  },
  { _id: false }
);

const lobbySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    game: String,
    rankMin: String,
    rankMax: String,
    rankMinValue: Number,
    rankMaxValue: Number,
    region: String,
    language: String,
    micRequired: Boolean,
    neededPlayers: Number,
    neededRoles: [String],
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
    description: String,
    inviteCode: String,
    discord: {
      type: discordRoomSchema,
      default: undefined
    }
  },
  { timestamps: true }
);

lobbySchema.index({ ownerId: 1, status: 1, game: 1 });
lobbySchema.index({ game: 1, status: 1, createdAt: -1 });

const Lobby = mongoose.model("Lobby", lobbySchema);

export default Lobby;
