import mongoose from "mongoose";

const gameSchema = new mongoose.Schema(
  {
    gameName: String,
    rank: String,
    rankValue: Number,
    roles: [String],
    playstyle: String,
    isPrimary: Boolean
  },
  { _id: false }
);

const availabilitySchema = new mongoose.Schema(
  {
    day: Number,
    hour: Number
  },
  { _id: false }
);

const playstyleStatsSchema = new mongoose.Schema(
  {
    aggression: { type: Number, default: 50 },
    support: { type: Number, default: 50 },
    communication: { type: Number, default: 50 },
    consistency: { type: Number, default: 50 },
    adaptability: { type: Number, default: 50 }
  },
  { _id: false }
);

const averageRatingsSchema = new mongoose.Schema(
  {
    communication: { type: Number, default: 0 },
    teamwork: { type: Number, default: 0 },
    skill: { type: Number, default: 0 },
    punctuality: { type: Number, default: 0 },
    behavior: { type: Number, default: 0 }
  },
  { _id: false }
);

const gamerProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },
    displayName: String,
    clutchTag: {
      type: String,
      trim: true,
      index: true
    },
    playerCode: {
      type: String,
      trim: true,
      index: true
    },
    gameHandles: {
      type: Map,
      of: String,
      default: {}
    },
    bio: String,
    region: String,
    country: String,
    languages: [String],
    micAvailable: Boolean,
    discordTag: String,
    lookingFor: [String],
    games: [gameSchema],
    availability: [availabilitySchema],
    playstyleStats: {
      type: playstyleStatsSchema,
      default: () => ({})
    },
    trustScore: {
      type: Number,
      default: 70
    },
    reliabilityScore: {
      type: Number,
      default: 80
    },
    totalReviews: {
      type: Number,
      default: 0
    },
    completedSessions: {
      type: Number,
      default: 0
    },
    noShows: {
      type: Number,
      default: 0
    },
    createdLobbies: {
      type: Number,
      default: 0
    },
    validReports: {
      type: Number,
      default: 0
    },
    averageRatings: {
      type: averageRatingsSchema,
      default: () => ({})
    },
    badges: [String],
    profileCompleteness: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

const GamerProfile = mongoose.model("GamerProfile", gamerProfileSchema);

export default GamerProfile;
