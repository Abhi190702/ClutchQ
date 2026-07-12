import GamerProfile from "../models/GamerProfile.js";
import GameActivity from "../models/GameActivity.js";
import GameplayGraph from "../models/GameplayGraph.js";
import MatchAnalysis from "../models/MatchAnalysis.js";
import { asyncHandler } from "../middleware/errorMiddleware.js";
import { calculatePlayerScore, getSteamIdentityForUser, getSteamSyncStatusForUser } from "../services/steamService.js";
import { sanitizeProfileUpdate } from "../utils/profileInput.js";
import { boundedQueryText } from "../utils/queryInput.js";
import { recalculateReputation } from "../services/reputationService.js";

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
  if (!profile) return { profile: null, warnings: [] };
  try {
    return { profile: await recalculateReputation(profile.userId), warnings: [] };
  } catch {
    return {
      profile,
      warnings: ["Profile saved; reputation will refresh after the next review or moderation update."]
    };
  }
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
const hasImageSignature = (buffer, mime) => {
  if (mime === "png") return buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (mime === "jpeg") return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (mime === "webp") return buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP";
  return false;
};

const validateAvatarDataUrl = (dataUrl) => {
  if (!dataUrl || typeof dataUrl !== "string") {
    return "Upload a PNG, JPG, or WebP image.";
  }

  const mimeMatch = dataUrl.match(avatarMimePattern);
  if (!mimeMatch) return "Upload a PNG, JPG, or WebP image.";

  const base64 = dataUrl.split(",")[1] || "";
  if (!base64 || !/^[A-Za-z0-9+/]+={0,2}$/.test(base64) || base64.length % 4 !== 0) {
    return "Upload a valid PNG, JPG, or WebP image.";
  }

  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  const bytes = Math.floor((base64.length * 3) / 4) - padding;
  if (bytes > 500 * 1024) {
    return "Avatar must be 500KB or smaller after compression.";
  }
  if (!hasImageSignature(Buffer.from(base64, "base64"), mimeMatch[1])) {
    return "The uploaded file does not match its PNG, JPG, or WebP type.";
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
  const existing = await GamerProfile.findOne({ userId: req.user._id });
  const updates = sanitizeProfileUpdate(req.body);

  if (Object.hasOwn(updates, "displayName") && !updates.displayName) {
    res.status(400);
    throw new Error("Display name cannot be empty.");
  }

  const merged = {
    ...(existing?.toObject() || {}),
    ...updates,
    userId: req.user._id
  };
  updates.profileCompleteness = calculateProfileCompleteness(merged);

  const profile = await GamerProfile.findOneAndUpdate(
    { userId: req.user._id },
    { $set: { ...updates, userId: req.user._id } },
    {
      upsert: true,
      new: true,
      runValidators: true,
      setDefaultsOnInsert: true
    }
  );

  const enriched = await enrichProfileScores(profile);

  res.json({
    success: true,
    message: "Profile saved successfully",
    data: enriched.profile,
    warnings: enriched.warnings
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
  const game = boundedQueryText(req.query.game);
  const region = boundedQueryText(req.query.region);
  const language = boundedQueryText(req.query.language, 40);
  const role = boundedQueryText(req.query.role, 50);
  const query = {};

  if (region) query.region = region;
  if (language) query.languages = language;
  if (game) query["games.gameName"] = game;
  if (role) query["games.roles"] = role;

  const requestedLimit = Number.parseInt(req.query.limit, 10);
  const limit = Number.isFinite(requestedLimit) ? Math.max(1, Math.min(80, requestedLimit)) : 80;
  const profiles = await GamerProfile.find(query)
    .select("-customAvatar.dataUrl")
    .populate({ path: "userId", select: "name avatar role isSuspended", match: { isSuspended: { $ne: true } } })
    .sort({ trustScore: -1, reliabilityScore: -1 })
    .limit(limit);

  res.json({
    success: true,
    message: "Profiles loaded",
    data: profiles.filter((profile) => profile.userId)
  });
});

export const getProfileById = asyncHandler(async (req, res) => {
  const profile = await GamerProfile.findById(req.params.id).populate("userId", "name avatar role createdAt isSuspended");

  if (!profile || !profile.userId || profile.userId.isSuspended) {
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
  const profile = await GamerProfile.findOne({ userId: req.params.userId }).populate("userId", "name avatar role createdAt isSuspended");

  if (!profile || !profile.userId || profile.userId.isSuspended) {
    res.status(404);
    throw new Error("Profile not found");
  }

  res.json({
    success: true,
    message: "Public profile loaded",
    data: profile
  });
});
