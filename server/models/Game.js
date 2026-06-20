import mongoose from "mongoose";

const gameSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      lowercase: true
    },
    title: String,
    category: String,
    genres: [String],
    platforms: [String],
    teamSize: Number,
    posterUrl: String,
    coverUrl: String,
    fallbackGradient: String,
    accentColor: String,
    status: String,
    description: String,
    supportedModes: [String],
    roles: [String],
    activeRooms: {
      type: Number,
      default: 0
    },
    activePlayers: {
      type: Number,
      default: 0
    },
    avgWaitMinutes: {
      type: Number,
      default: 5
    },
    active: {
      type: Boolean,
      default: true
    },
    source: String
  },
  { timestamps: true }
);

const Game = mongoose.model("Game", gameSchema);

export default Game;
