import mongoose from "mongoose";
import GameActivity from "../models/GameActivity.js";
import GamePlaytimeAggregate from "../models/GamePlaytimeAggregate.js";
import GameplayGraph from "../models/GameplayGraph.js";
import GamerProfile from "../models/GamerProfile.js";
import Lobby from "../models/Lobby.js";
import ScorecardAnalysis from "../models/ScorecardAnalysis.js";
import ScorecardUpload from "../models/ScorecardUpload.js";
import SteamAchievement from "../models/SteamAchievement.js";
import SteamGame from "../models/SteamGame.js";
import SteamFriend from "../models/SteamFriend.js";
import TeammateFeedback from "../models/TeammateFeedback.js";
import User from "../models/User.js";
import { asyncHandler } from "../middleware/errorMiddleware.js";
import {
  analyticsHealth,
  analyzeScorecard,
  buildRhythm,
  computeTeammateFit,
  rebuildGameplayGraph
} from "../services/analyticsWorkerService.js";

const allowedImageMimes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxImageBytes = 900 * 1024;
const maxCommentLength = 500;

const clamp = (value, min = 0, max = 100) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.max(min, Math.min(max, Math.round(number)));
};

const toPlain = (doc) => (doc?.toObject ? doc.toObject() : doc);

const dataUrlBytes = (dataUrl = "") => {
  const base64 = String(dataUrl).split(",")[1] || "";
  return Math.ceil((base64.length * 3) / 4);
};

const parseDataUrl = (dataUrl) => {
  if (!dataUrl) return { imageMime: "", imageSizeBytes: 0 };
  const match = String(dataUrl).match(/^data:([^;,]+);base64,([a-zA-Z0-9+/=]+)$/);
  if (!match) {
    const error = new Error("Scorecard image must be a valid base64 data URL.");
    error.statusCode = 400;
    throw error;
  }

  const imageMime = match[1];
  if (!allowedImageMimes.has(imageMime)) {
    const error = new Error("Scorecard image must be PNG, JPG, or WebP.");
    error.statusCode = 400;
    throw error;
  }

  const imageSizeBytes = dataUrlBytes(dataUrl);
  if (imageSizeBytes > maxImageBytes) {
    const error = new Error("Scorecard image is too large. Compress it under 900KB.");
    error.statusCode = 413;
    throw error;
  }

  return { imageMime, imageSizeBytes };
};

const optionalObjectId = (value, field) => {
  if (!value) return undefined;
  if (!mongoose.isValidObjectId(value)) {
    const error = new Error(`Invalid ${field}.`);
    error.statusCode = 400;
    throw error;
  }
  return value;
};

const cleanManualStats = (manualStats = {}) => {
  const numericFields = ["kills", "deaths", "assists", "damage", "placement", "score", "durationMinutes", "revives"];
  const output = {};

  numericFields.forEach((field) => {
    if (manualStats[field] === null || manualStats[field] === undefined || manualStats[field] === "") return;
    const number = Number(manualStats[field]);
    if (!Number.isFinite(number) || number < 0 || number > 100000) {
      const error = new Error(`Invalid scorecard stat: ${field}`);
      error.statusCode = 400;
      throw error;
    }
    output[field] = number;
  });

  if (manualStats.result) {
    const result = String(manualStats.result).trim().toLowerCase();
    output.result = ["win", "loss", "completed", "unknown"].includes(result) ? result : "completed";
  }

  return output;
};

const cleanRatings = (ratings = {}) => {
  const fields = ["communication", "teamwork", "reliability", "skill", "behavior"];
  const output = {};

  fields.forEach((field) => {
    const value = ratings[field];
    if (value === undefined || value === null || value === "") return;
    const number = Number(value);
    if (!Number.isFinite(number) || number < 1 || number > 5) {
      const error = new Error("Feedback ratings must be between 1 and 5.");
      error.statusCode = 400;
      throw error;
    }
    output[field] = number;
  });

  return output;
};

const averageRatingField = (feedbackDocs, field) => {
  const values = feedbackDocs
    .map((item) => Number(item.ratings?.[field]))
    .filter(Number.isFinite);
  if (!values.length) return undefined;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

const getSessionForUser = async (sessionId, userId) => {
  if (!sessionId) return null;
  if (!mongoose.isValidObjectId(sessionId)) {
    const error = new Error("Invalid session id.");
    error.statusCode = 400;
    throw error;
  }

  const session = await GameActivity.findOne({ _id: sessionId, userId });
  if (!session) {
    const error = new Error("Session not found.");
    error.statusCode = 404;
    throw error;
  }
  return session;
};

const buildSteamContext = async (userId, gameName) => {
  const [library, achievements] = await Promise.all([
    SteamGame.find({ userId }).sort({ playtimeForeverMinutes: -1 }).limit(120).lean(),
    SteamAchievement.find({ userId }).lean()
  ]);

  const lowerName = String(gameName || "").toLowerCase();
  const game = library.find((item) => String(item.name || "").toLowerCase() === lowerName) || library[0];
  const achieved = achievements.filter((item) => item.achieved).length;

  return {
    library,
    achievements,
    steamContext: {
      totalGameMinutes: game?.playtimeForeverMinutes || 0,
      recentGameMinutes: game?.playtimeLastTwoWeeksMinutes || 0,
      achievementCompletion: achievements.length ? Math.round((achieved / achievements.length) * 100) : 0
    }
  };
};

const loadGraphBundle = async (userId) => {
  const [userProfile, sessions, scorecards, feedbackReceived, feedbackGiven, steamLibrary, steamAchievements, friends, lobbies] = await Promise.all([
    GamerProfile.findOne({ userId }).lean(),
    GameActivity.find({ userId }).sort({ startedAt: -1 }).limit(120).lean(),
    ScorecardAnalysis.find({ userId }).sort({ createdAt: -1 }).limit(80).lean(),
    TeammateFeedback.find({ toUserId: userId }).sort({ createdAt: -1 }).limit(80).lean(),
    TeammateFeedback.find({ fromUserId: userId }).sort({ createdAt: -1 }).limit(80).lean(),
    SteamGame.find({ userId }).sort({ playtimeForeverMinutes: -1 }).limit(120).lean(),
    SteamAchievement.find({ userId }).limit(300).lean(),
    SteamFriend.find({ userId }).limit(80).lean(),
    Lobby.find({ $or: [{ ownerId: userId }, { "currentMembers.userId": userId }] }).sort({ updatedAt: -1 }).limit(40).lean()
  ]);

  return {
    user: { _id: String(userId) },
    profile: userProfile,
    sessions,
    scorecardAnalyses: scorecards,
    feedbackReceived,
    feedbackGiven,
    steamLibrary,
    steamAchievements,
    friends,
    lobbies
  };
};

export const rebuildGraphForUser = async (userId) => {
  const payload = await loadGraphBundle(userId);
  const result = await rebuildGameplayGraph(payload);
  const data = result.data || {};
  const graph = await GameplayGraph.findOneAndUpdate(
    { userId },
    {
      $set: {
        ...data,
        userId,
        source: result.source || "fallback",
        lastBuiltAt: new Date()
      }
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  return {
    graph,
    warnings: result.warnings || [],
    confidence: result.confidence ?? data.confidence ?? graph.confidence,
    source: result.source || "fallback"
  };
};

export const getIntelligenceHealth = asyncHandler(async (req, res) => {
  const data = await analyticsHealth();
  res.json({
    success: true,
    message: data.pythonAvailable ? "Python analytics worker ready" : "Fallback analytics ready",
    data
  });
});

export const uploadScorecard = asyncHandler(async (req, res) => {
  const { sessionId, lobbyId, gameSlug, gameName, imageDataUrl, manualStats = {} } = req.body;
  const session = await getSessionForUser(sessionId, req.user._id);
  const safeLobbyId = optionalObjectId(lobbyId, "lobby id");
  const finalGameSlug = gameSlug || session?.gameSlug;
  const finalGameName = gameName || session?.gameName;

  if (!finalGameSlug || !finalGameName) {
    res.status(400);
    throw new Error("Game is required for scorecard analysis.");
  }

  const { imageMime, imageSizeBytes } = parseDataUrl(imageDataUrl);
  const cleanedStats = cleanManualStats(manualStats);
  const { steamContext } = await buildSteamContext(req.user._id, finalGameName);

  const upload = await ScorecardUpload.create({
    userId: req.user._id,
    sessionId: session?._id,
    lobbyId: safeLobbyId,
    gameSlug: finalGameSlug,
    gameName: finalGameName,
    imageDataUrl,
    imageMime,
    imageSizeBytes,
    status: "pending"
  });

  const feedbackDocs = await TeammateFeedback.find({ toUserId: req.user._id }).sort({ createdAt: -1 }).limit(20).lean();
  const feedbackSummary = feedbackDocs.length
    ? ["communication", "teamwork", "reliability", "skill", "behavior"].reduce((summary, field) => {
        const averageValue = averageRatingField(feedbackDocs, field);
        if (averageValue !== undefined) summary[field] = averageValue;
        return summary;
      }, {})
    : {};

  const analysisResult = await analyzeScorecard({
    gameSlug: finalGameSlug,
    gameName: finalGameName,
    manualStats: cleanedStats,
    scorecardMeta: {
      hasImage: Boolean(imageDataUrl),
      imageMime,
      imageSizeBytes,
      ocrText: ""
    },
    session: session ? toPlain(session) : {},
    feedbackSummary,
    steamContext
  });

  const analysisData = analysisResult.data || {};
  const analysis = await ScorecardAnalysis.create({
    userId: req.user._id,
    sessionId: session?._id,
    uploadId: upload._id,
    gameSlug: finalGameSlug,
    gameName: finalGameName,
    detectedGame: analysisData.detectedGame,
    gameType: analysisData.gameType,
    extractedStats: analysisData.extractedStats,
    performance: analysisData.performance,
    situationalSignals: analysisData.situationalSignals,
    summary: analysisData.summary || [],
    warnings: [...(analysisData.warnings || []), ...(analysisResult.warnings || [])],
    confidence: analysisData.confidence ?? analysisResult.confidence,
    source: analysisResult.source || "fallback"
  });

  upload.status = "processed";
  upload.processedAt = new Date();
  await upload.save();

  const graph = await rebuildGraphForUser(req.user._id);

  res.status(201).json({
    success: true,
    message: "Scorecard analysis generated",
    data: {
      upload,
      analysis,
      graph: graph.graph,
      warnings: [...(analysisResult.warnings || []), ...(graph.warnings || [])]
    }
  });
});

export const getMyScorecards = asyncHandler(async (req, res) => {
  const analyses = await ScorecardAnalysis.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(40);
  res.json({
    success: true,
    message: "Scorecard analyses loaded",
    data: analyses
  });
});

export const submitSessionFeedback = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const session = await getSessionForUser(sessionId, req.user._id);
  const { toUserId, ratings = {}, wouldPlayAgain = "skipped", comment = "", skipped = false } = req.body;

  if (!toUserId || !mongoose.isValidObjectId(toUserId)) {
    res.status(400);
    throw new Error("Teammate is required.");
  }

  if (String(toUserId) === String(req.user._id)) {
    res.status(400);
    throw new Error("You cannot submit teammate feedback for yourself.");
  }

  const teammateExists = await User.exists({ _id: toUserId });
  if (!teammateExists) {
    res.status(404);
    throw new Error("Teammate not found.");
  }

  const cleanedRatings = skipped ? {} : cleanRatings(ratings);
  const safeComment = String(comment || "").trim().slice(0, maxCommentLength);
  const playAgain = ["yes", "maybe", "no", "skipped"].includes(wouldPlayAgain) ? wouldPlayAgain : "skipped";

  const feedback = await TeammateFeedback.findOneAndUpdate(
    { sessionId: session._id, fromUserId: req.user._id, toUserId },
    {
      $set: {
        lobbyId: session.roomId,
        ratings: cleanedRatings,
        wouldPlayAgain: skipped ? "skipped" : playAgain,
        comment: safeComment,
        skipped: Boolean(skipped)
      }
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  const [giverGraph, receiverGraph] = await Promise.all([
    rebuildGraphForUser(req.user._id),
    rebuildGraphForUser(toUserId)
  ]);

  res.json({
    success: true,
    message: skipped ? "Feedback skipped" : "Teammate feedback saved",
    data: {
      feedback,
      graph: giverGraph.graph,
      receiverGraph: receiverGraph.graph,
      warnings: [...(giverGraph.warnings || []), ...(receiverGraph.warnings || [])]
    }
  });
});

export const rebuildMyGraph = asyncHandler(async (req, res) => {
  const graph = await rebuildGraphForUser(req.user._id);
  res.json({
    success: true,
    message: "Gameplay graph rebuilt",
    data: graph
  });
});

export const getMyGraph = asyncHandler(async (req, res) => {
  let graph = await GameplayGraph.findOne({ userId: req.user._id });
  let warnings = [];

  if (!graph) {
    const rebuilt = await rebuildGraphForUser(req.user._id);
    graph = rebuilt.graph;
    warnings = rebuilt.warnings || [];
  }

  res.json({
    success: true,
    message: "Gameplay graph loaded",
    data: {
      graph,
      warnings
    }
  });
});

export const getMyRhythm = asyncHandler(async (req, res) => {
  const [sessions, aggregates, steamLibrary] = await Promise.all([
    GameActivity.find({ userId: req.user._id }).sort({ startedAt: -1 }).limit(160).lean(),
    GamePlaytimeAggregate.find({ userId: req.user._id }).sort({ totalMinutes: -1 }).lean(),
    SteamGame.find({ userId: req.user._id }).sort({ playtimeForeverMinutes: -1 }).limit(120).lean()
  ]);

  const result = await buildRhythm({
    sessions,
    steamLibrary: steamLibrary.length ? steamLibrary : aggregates,
    steamHeatmap: []
  });

  if (result.data?.summary) {
    await GameplayGraph.findOneAndUpdate(
      { userId: req.user._id },
      { $set: { userId: req.user._id, rhythmSummary: result.data.summary, lastBuiltAt: new Date() } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  res.json({
    success: true,
    message: "Rhythm intelligence loaded",
    data: {
      ...result.data,
      warnings: result.warnings || [],
      source: result.source || "fallback"
    }
  });
});

export const getMyTeammates = asyncHandler(async (req, res) => {
  const viewerGraphDoc = (await GameplayGraph.findOne({ userId: req.user._id }).lean()) || (await rebuildGraphForUser(req.user._id)).graph.toObject();
  const profiles = await GamerProfile.find({ userId: { $ne: req.user._id } }).populate("userId", "name avatar").limit(24).lean();
  const candidateUserIds = profiles.map((profile) => profile.userId?._id || profile.userId).filter(Boolean);
  const graphDocs = await GameplayGraph.find({ userId: { $in: candidateUserIds } }).lean();
  const graphByUser = new Map(graphDocs.map((graph) => [String(graph.userId), graph]));
  const candidateGraphs = profiles.map((profile) => graphByUser.get(String(profile.userId?._id || profile.userId)) || { userId: profile.userId?._id || profile.userId, gameplayProfileScore: 60, confidence: 0.34, gameProfiles: [] });

  const result = await computeTeammateFit({
    viewerGraph: viewerGraphDoc,
    candidateGraphs,
    candidateProfiles: profiles,
    sharedSessions: [],
    reviews: []
  });

  res.json({
    success: true,
    message: "Teammate fit loaded",
    data: {
      matches: result.data?.matches || [],
      warnings: result.warnings || [],
      source: result.source || "fallback"
    }
  });
});
