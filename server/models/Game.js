import mongoose from "mongoose";

const gameSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      lowercase: true,
      maxlength: 80
    },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    category: { type: String, trim: true, maxlength: 80 },
    genres: [{ type: String, trim: true, maxlength: 60 }],
    platforms: [{ type: String, trim: true, maxlength: 60 }],
    teamSize: { type: Number, min: 1, max: 100 },
    posterUrl: { type: String, maxlength: 2048 },
    coverUrl: { type: String, maxlength: 2048 },
    fallbackGradient: { type: String, maxlength: 500 },
    accentColor: { type: String, maxlength: 30 },
    status: { type: String, trim: true, maxlength: 40 },
    description: { type: String, trim: true, maxlength: 2000 },
    supportedModes: [{ type: String, trim: true, maxlength: 80 }],
    roles: [{ type: String, trim: true, maxlength: 60 }],
    activeRooms: {
      type: Number,
      default: 0,
      min: 0
    },
    activePlayers: {
      type: Number,
      default: 0,
      min: 0
    },
    avgWaitMinutes: {
      type: Number,
      default: 5,
      min: 0,
      max: 1440
    },
    active: {
      type: Boolean,
      default: true
    },
    source: { type: String, trim: true, maxlength: 40 }
  },
  { timestamps: true }
);

const Game = mongoose.model("Game", gameSchema);

export default Game;
