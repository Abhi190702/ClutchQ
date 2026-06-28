import GamerProfile from "../models/GamerProfile.js";
import GameActivity from "../models/GameActivity.js";
import GameplayGraph from "../models/GameplayGraph.js";
import MatchAnalysis from "../models/MatchAnalysis.js";
import Review from "../models/Review.js";
import Report from "../models/Report.js";
import { asyncHandler } from "../middleware/errorMiddleware.js";
import { normalizeGameRank } from "../utils/rankLogic.js";
import generateBadges from "../utils/badgeEngine.js";
import { summarizeReviewRatings } from "../utils/calculateTrustScore.js";
import { calculatePlayerScore, getSteamIdentityForUser, getSteamSyncStatusForUser } from "../services/steamService.js";

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

const connectedAccountsForUser = (user) => {
  const safe = user.toSafeJSON ? user.toSafeJSON() : user;
  const providers = safe.authProviders || {};

  return [
    { id: "google", label: "Google", status: providers.google ? "connected" : "not_connected", username: providers.google?.email || providers.google?.name, lastSyncedAt: providers.google?.connectedAt },
    { id: "discord", label: "Discord", status: providers.discord ? "connected" : "not_connected", username: providers.discord?.globalName || providers.discord?.username, lastSyncedAt: providers.discord?.connectedAt },
    { id: "steam", label: "Steam", status: providers.steam ? "connected" : "not_connected", username: providers.steam?.displayName, profileUrl: providers.steam?.profileUrl, lastSyncedAt: providers.steam?.lastSyncedAt || providers.steam?.connectedAt },
    { id: "epic", label: "Epic Games", status: providers.epic ? "connected" : "coming_soon", username: providers.epic?.displayName, lastSyncedAt: providers.epic?.connectedAt },
    { id: "microsoft", label: "Microsoft", status: providers.microsoft ? "connected" : "coming_soon", username: providers.microsoft?.displayName || providers.microsoft?.email, lastSyncedAt: providers.microsoft?.connectedAt },
    { id: "psn", label: "PlayStation Network", status: "manual_soon" },
    { id: "nintendo", label: "Nintendo Account", status: "manual_soon" }
  ];
};

const buildProfileBundle = async (req) => {
  const [profile, steamSummary, steamSyncStatus, playerScore, recentActivity, recentAnalysis, gameplayGraph] = await Promise.all([
    GamerProfile.findOne({ userId: req.user._id }).populate("userId", "name email avatar role createdAt"),
    getSteamIdentityForUser(req.user),
    getSteamSyncStatusForUser(req.user),
    calculatePlayerScore(req.user),
    GameActivity.find({ userId: req.user._id }).sort({ startedAt: -1 }).limit(8),
    MatchAnalysis.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(6),
    GameplayGraph.findOne({ userId: req.user._id }).lean()
  ]);

  return {
    user: req.user.toSafeJSON ? req.user.toSafeJSON() : req.user,
    profile,
    connectedAccounts: connectedAccountsForUser(req.user),
    steamSummary,
    steamSyncStatus,
    playerScore,
    gameplayGraph,
    recentActivitySummary: {
      sessions: recentActivity,
      analysis: recentAnalysis,
      totalRecentMinutes: recentActivity.reduce((sum, item) => sum + (item.durationMinutes || 0), 0)
    }
  };
};

const avatarMimePattern = /^data:image\/(png|jpeg|webp);base64,/;

const validateAvatarDataUrl = (dataUrl) => {
  if (!dataUrl || typeof dataUrl !== "string" || !avatarMimePattern.test(dataUrl)) {
    return "Upload a PNG, JPG, or WebP image.";
  }

  const base64 = dataUrl.split(",")[1] || "";
  const bytes = Math.ceil((base64.length * 3) / 4);
  if (bytes > 500 * 1024) {
    return "Avatar must be 500KB or smaller after compression.";
  }

  return null;
};

export const getCurrentProfile = asyncHandler(async (req, res) => {
  if (req.baseUrl.endsWith("/profile")) {
    return res.json({
      success: true,
      message: "Profile bundle loaded",
      data: await buildProfileBundle(req)
    });
  }

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

export const uploadProfileAvatar = asyncHandler(async (req, res) => {
  const { dataUrl } = req.body;
  const error = validateAvatarDataUrl(dataUrl);
  if (error) {
    res.status(400);
    throw new Error(error);
  }

  const profile = await GamerProfile.findOneAndUpdate(
    { userId: req.user._id },
    {
      $set: {
        userId: req.user._id,
        customAvatar: {
          dataUrl,
          uploadedAt: new Date()
        }
      }
    },
    { new: true, upsert: true, runValidators: true }
  ).populate("userId", "name email avatar role createdAt");

  res.json({
    success: true,
    message: "Profile photo updated",
    data: profile
  });
});

export const deleteProfileAvatar = asyncHandler(async (req, res) => {
  const profile = await GamerProfile.findOneAndUpdate(
    { userId: req.user._id },
    { $unset: { customAvatar: "" } },
    { new: true }
  ).populate("userId", "name email avatar role createdAt");

  res.json({
    success: true,
    message: "Profile photo removed",
    data: profile
  });
});

export const getProfileSummary = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    message: "Profile summary loaded",
    data: await buildProfileBundle(req)
  });
});

export const getProfilePlayerScore = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    message: "Player score loaded",
    data: await calculatePlayerScore(req.user)
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
