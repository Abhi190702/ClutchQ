import GamerProfile from "../models/GamerProfile.js";
import Review from "../models/Review.js";
import Report from "../models/Report.js";
import { asyncHandler } from "../middleware/errorMiddleware.js";
import { normalizeGameRank } from "../utils/rankLogic.js";
import generateBadges from "../utils/badgeEngine.js";
import { summarizeReviewRatings } from "../utils/calculateTrustScore.js";

const completenessFields = [
  "displayName",
  "bio",
  "region",
  "country",
  "languages",
  "micAvailable",
  "discordTag",
  "lookingFor",
  "games",
  "availability",
  "playstyleStats"
];

const calculateProfileCompleteness = (payload) => {
  const complete = completenessFields.reduce((count, field) => {
    const value = payload[field];
    if (Array.isArray(value)) return count + (value.length ? 1 : 0);
    if (typeof value === "object" && value !== null) return count + (Object.keys(value).length ? 1 : 0);
    if (typeof value === "boolean") return count + 1;
    return count + (value ? 1 : 0);
  }, 0);

  return Math.round((complete / completenessFields.length) * 100);
};

const enrichProfileScores = async (profile) => {
  if (!profile) return null;
  const reviews = await Review.find({ reviewedUserId: profile.userId });
  const reportCount = await Report.countDocuments({ reportedUserId: profile.userId, status: { $ne: "dismissed" } });
  const averageRatings = summarizeReviewRatings(reviews);
  const badges = generateBadges({ profile: { ...profile.toObject(), averageRatings }, reviews, reportCount });

  profile.averageRatings = averageRatings;
  profile.totalReviews = reviews.length;
  profile.badges = badges;
  await profile.save();

  return profile;
};

export const getCurrentProfile = asyncHandler(async (req, res) => {
  const profile = await GamerProfile.findOne({ userId: req.user._id }).populate("userId", "name email avatar role createdAt");

  res.json({
    success: true,
    message: "Profile loaded",
    data: profile
  });
});

export const upsertCurrentProfile = asyncHandler(async (req, res) => {
  const payload = {
    ...req.body,
    userId: req.user._id,
    games: (req.body.games || []).map(normalizeGameRank)
  };

  payload.profileCompleteness = calculateProfileCompleteness(payload);

  const profile = await GamerProfile.findOneAndUpdate({ userId: req.user._id }, payload, {
    upsert: true,
    new: true,
    runValidators: true
  });

  const enriched = await enrichProfileScores(profile);

  res.json({
    success: true,
    message: "Profile saved successfully",
    data: enriched
  });
});

export const listProfiles = asyncHandler(async (req, res) => {
  const { game, region, language, role } = req.query;
  const query = {};

  if (region) query.region = region;
  if (language) query.languages = language;
  if (game) query["games.gameName"] = game;
  if (role) query["games.roles"] = role;

  const profiles = await GamerProfile.find(query)
    .populate("userId", "name email avatar role isSuspended")
    .sort({ trustScore: -1, reliabilityScore: -1 })
    .limit(80);

  res.json({
    success: true,
    message: "Profiles loaded",
    data: profiles
  });
});

export const getProfileById = asyncHandler(async (req, res) => {
  const profile = await GamerProfile.findById(req.params.id).populate("userId", "name email avatar role createdAt");

  if (!profile) {
    res.status(404);
    throw new Error("Profile not found");
  }

  res.json({
    success: true,
    message: "Public profile loaded",
    data: profile
  });
});

export const getProfileByUserId = asyncHandler(async (req, res) => {
  const profile = await GamerProfile.findOne({ userId: req.params.userId }).populate("userId", "name email avatar role createdAt");

  if (!profile) {
    res.status(404);
    throw new Error("Profile not found");
  }

  res.json({
    success: true,
    message: "Public profile loaded",
    data: profile
  });
});
