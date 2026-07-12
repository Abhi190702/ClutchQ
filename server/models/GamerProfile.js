import mongoose from "mongoose";

const boundedScore = { type: Number, min: 0, max: 100 };
const boundedRating = { type: Number, default: 0, min: 0, max: 5 };

const gameSchema = new mongoose.Schema(
  {
    gameName: { type: String, trim: true, maxlength: 100 },
    rank: { type: String, trim: true, maxlength: 50 },
    rankValue: { type: Number, min: 0 },
    roles: [{ type: String, trim: true, maxlength: 50 }],
    playstyle: { type: String, trim: true, maxlength: 60 },
    isPrimary: Boolean
  },
  { _id: false }
);

const availabilitySchema = new mongoose.Schema(
  {
    day: { type: Number, min: 0, max: 6 },
    hour: { type: Number, min: 0, max: 23 }
  },
  { _id: false }
);

const playstyleStatsSchema = new mongoose.Schema(
  {
    aggression: boundedScore,
    support: boundedScore,
    communication: boundedScore,
    consistency: boundedScore,
    adaptability: boundedScore
  },
  { _id: false }
);

const averageRatingsSchema = new mongoose.Schema(
  {
    communication: boundedRating,
    teamwork: boundedRating,
    skill: boundedRating,
    punctuality: boundedRating,
    behavior: boundedRating
  },
  { _id: false }
);

const customAvatarSchema = new mongoose.Schema(
  {
    dataUrl: { type: String, maxlength: 700000 },
    uploadedAt: Date
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
    displayName: { type: String, trim: true, maxlength: 60 },
    clutchTag: { type: String, trim: true, maxlength: 80, index: true },
    playerCode: { type: String, trim: true, maxlength: 80, index: true },
    gameHandles: {
      type: Map,
      of: String,
      default: {}
    },
    customAvatar: {
      type: customAvatarSchema,
      default: undefined
    },
    bio: { type: String, trim: true, maxlength: 500 },
    region: { type: String, trim: true, maxlength: 80 },
    country: { type: String, trim: true, maxlength: 80 },
    languages: [{ type: String, trim: true, maxlength: 40 }],
    micAvailable: Boolean,
    discordTag: { type: String, trim: true, maxlength: 80 },
    lookingFor: [{ type: String, trim: true, maxlength: 60 }],
    games: [gameSchema],
    availability: [availabilitySchema],
    playstyleStats: {
      type: playstyleStatsSchema,
      default: undefined
    },
    trustScore: { type: Number, default: 70, min: 0, max: 100 },
    reliabilityScore: { type: Number, default: 80, min: 0, max: 100 },
    totalReviews: { type: Number, default: 0, min: 0 },
    completedSessions: { type: Number, default: 0, min: 0 },
    noShows: { type: Number, default: 0, min: 0 },
    createdLobbies: { type: Number, default: 0, min: 0 },
    validReports: { type: Number, default: 0, min: 0 },
    averageRatings: {
      type: averageRatingsSchema,
      default: () => ({})
    },
    badges: [{ type: String, trim: true, maxlength: 80 }],
    profileCompleteness: { type: Number, default: 0, min: 0, max: 100 }
  },
  { timestamps: true }
);

const GamerProfile = mongoose.model("GamerProfile", gamerProfileSchema);

export default GamerProfile;
