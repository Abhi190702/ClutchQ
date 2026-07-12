import mongoose from "mongoose";
import GameActivity from "../models/GameActivity.js";
import GamePlaytimeAggregate from "../models/GamePlaytimeAggregate.js";
import GameplayGraph from "../models/GameplayGraph.js";
import GamerProfile from "../models/GamerProfile.js";
import Lobby from "../models/Lobby.js";
import GameRoom from "../models/GameRoom.js";
import Session from "../models/Session.js";
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
import { booleanInput, cleanTextInput, numberInput } from "../utils/inputValue.js";
import { publicOperationalError } from "../utils/publicError.js";
import { isSharedDemoUser } from "../utils/demoAccounts.js";

const allowedImageMimes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxImageBytes = 900 * 1024;
const maxCommentLength = 500;
const maxFeedbackItems = 8;
const feedbackRatingFields = ["communication", "teamwork", "reliability", "skill", "behavior"];
const ratingEvidenceFilter = {
  $or: feedbackRatingFields.map((field) => ({ [`ratings.${field}`]: { $exists: true } }))
};

const sanitizeText = cleanTextInput;

const sanitizeSlug = (value = "") =>
  sanitizeText(value, 80)
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/(^-|-$)/g, "");

const clamp = (value, min = 0, max = 100) => {
  const number = numberInput(value);
  if (number === undefined) return min;
  return Math.max(min, Math.min(max, Math.round(number)));
};

const cleanGraphData = (data = {}) => {
  const cleanPerformance = (value = {}) => ({
    combat: clamp(value.combat),
    support: clamp(value.support),
    survival: clamp(value.survival),
    objectiveFocus: clamp(value.objectiveFocus)
  });
  const style = data.style && typeof data.style === "object" ? data.style : {};

  return {
    gameplayProfileScore: clamp(data.gameplayProfileScore),
    confidence: Math.max(0, Math.min(1, Number(data.confidence) || 0)),
    style: {
      mainStyle: sanitizeText(style.mainStyle || "Profile still forming", 120),
      competitiveTendency: clamp(style.competitiveTendency),
      cooperativeTendency: clamp(style.cooperativeTendency),
      riskProfile: sanitizeText(style.riskProfile || "Not enough data", 120),
      bestSquadFit: sanitizeText(style.bestSquadFit || "Build more tracked sessions for a reliable squad fit", 200)
    },
    gameProfiles: (Array.isArray(data.gameProfiles) ? data.gameProfiles : []).slice(0, 12).map((item) => ({
      gameSlug: sanitizeSlug(item?.gameSlug || item?.gameName),
      gameName: sanitizeText(item?.gameName || "Game", 120),
      minutes: Math.max(0, Math.min(10_000_000, Math.round(Number(item?.minutes) || 0))),
      sessions: Math.max(0, Math.min(100_000, Math.round(Number(item?.sessions) || 0))),
      averageRating: clamp(item?.averageRating),
      performance: cleanPerformance(item?.performance),
      roleSignal: sanitizeText(item?.roleSignal || "Activity only", 120)
    })),
    situationalStrengths: (Array.isArray(data.situationalStrengths) ? data.situationalStrengths : [])
      .slice(0, 12)
      .map((item) => ({
        key: sanitizeSlug(item?.key),
        label: sanitizeText(item?.label, 100),
        score: clamp(item?.score),
        evidence: sanitizeText(item?.evidence, 300)
      })),
    teammateEdges: (Array.isArray(data.teammateEdges) ? data.teammateEdges : [])
      .filter((item) => mongoose.isValidObjectId(item?.userId))
      .slice(0, 80)
      .map((item) => ({
        userId: item.userId,
        name: sanitizeText(item?.name || "ClutchQ teammate", 100),
        compatibility: clamp(item?.compatibility),
        sharedGames: (Array.isArray(item?.sharedGames) ? item.sharedGames : []).slice(0, 12).map((game) => sanitizeText(game, 120)),
        reason: sanitizeText(item?.reason, 300)
      })),
    recommendations: (Array.isArray(data.recommendations) ? data.recommendations : [])
      .slice(0, 12)
      .map((item) => sanitizeText(item, 500))
      .filter(Boolean)
  };
};

const cleanRhythmSummary = (summary = {}) => ({
  totalMinutes: Math.max(0, Math.min(10_000_000, Math.round(Number(summary.totalMinutes) || 0))),
  activeDays: Math.max(0, Math.min(366, Math.round(Number(summary.activeDays) || 0))),
  bestDayMinutes: Math.max(0, Math.min(24 * 60, Math.round(Number(summary.bestDayMinutes) || 0))),
  currentStreak: Math.max(0, Math.min(366, Math.round(Number(summary.currentStreak) || 0))),
  bestStreak: Math.max(0, Math.min(366, Math.round(Number(summary.bestStreak) || 0))),
  dominantGame: sanitizeText(summary.dominantGame || "Not synced yet", 120),
  dominantGameShare: clamp(summary.dominantGameShare),
  rhythmScore: clamp(summary.rhythmScore)
});

const toPlain = (doc) => (doc?.toObject ? doc.toObject() : doc);
const sanitizeActivityEvidence = (doc) => {
  const activity = { ...(toPlain(doc) || {}) };
  const hasRatedSignal = [
    activity.teamworkScore,
    activity.communicationScore,
    activity.reliabilityScore,
    activity.performanceScore
  ].some(Number.isFinite);
  if (!hasRatedSignal && activity.matchRating === 0) delete activity.matchRating;
  return activity;
};

const dataUrlBytes = (dataUrl = "") => {
  const base64 = String(dataUrl).split(",")[1] || "";
  return Math.ceil((base64.length * 3) / 4);
};

const validImageSignature = (buffer, mime) => {
  if (mime === "image/png") return buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (mime === "image/jpeg") return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (mime === "image/webp") return buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP";
  return false;
};

const parseDataUrl = (dataUrl) => {
  if (!dataUrl) return { imageMime: "", imageSizeBytes: 0 };
  if (typeof dataUrl !== "string") {
    const error = new Error("Scorecard image must be a valid base64 data URL.");
    error.statusCode = 400;
    throw error;
  }
  const match = dataUrl.match(/^data:([^;,]+);base64,([a-zA-Z0-9+/=]+)$/);
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
  if (!validImageSignature(Buffer.from(match[2], "base64"), imageMime)) {
    const error = new Error("Scorecard file content does not match its image type.");
    error.statusCode = 400;
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
    const number = numberInput(manualStats[field]);
    if (number === undefined || number < 0 || number > 100000) {
      const error = new Error(`Invalid scorecard stat: ${field}`);
      error.statusCode = 400;
      throw error;
    }
    output[field] = number;
  });

  if (manualStats.result) {
    const result = sanitizeText(manualStats.result, 24).toLowerCase();
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
    const number = numberInput(value);
    if (number === undefined || number < 1 || number > 5) {
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

  const session = await GameActivity.findOne({ _id: sessionId, userId, status: "completed" });
  if (!session) {
    const error = new Error("Session not found.");
    error.statusCode = 404;
    throw error;
  }
  return session;
};

const canSubmitFeedbackFor = async (session, fromUserId, toUserId) => {
  const pair = [fromUserId, toUserId];
  const sessionTime = new Date(session.endedAt || session.startedAt || session.createdAt || Date.now());
  const windowStart = new Date(sessionTime.getTime() - 24 * 60 * 60 * 1000);
  const windowEnd = new Date(sessionTime.getTime() + 24 * 60 * 60 * 1000);
  const [sharedLobby, sharedSession, sharedRoom] = await Promise.all([
    Lobby.exists({
      "currentMembers.userId": { $all: pair },
      status: "closed",
      $or: [
        { startTime: { $gte: windowStart, $lte: windowEnd } },
        { updatedAt: { $gte: windowStart, $lte: windowEnd } }
      ]
    }),
    Session.exists({
      "members.userId": { $all: pair },
      result: { $ne: "cancelled" },
      startedAt: { $gte: windowStart, $lte: windowEnd }
    }),
    session.roomId ? GameRoom.exists({ _id: session.roomId, "currentMembers.userId": { $all: pair } }) : null
  ]);

  return Boolean(sharedLobby || sharedSession || sharedRoom);
};

const buildSteamContext = async (userId, gameName) => {
  const [library, achievements] = await Promise.all([
    SteamGame.find({ userId }).sort({ playtimeForeverMinutes: -1 }).limit(120).lean(),
    SteamAchievement.find({ userId }).limit(500).lean()
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
    GamerProfile.findOne({ userId }).select("-customAvatar.dataUrl").lean(),
    GameActivity.find({ userId, status: "completed" }).sort({ startedAt: -1 }).limit(120).lean(),
    ScorecardAnalysis.find({ userId }).sort({ createdAt: -1 }).limit(80).lean(),
    TeammateFeedback.find({ toUserId: userId, skipped: { $ne: true }, ...ratingEvidenceFilter }).sort({ createdAt: -1 }).limit(80).lean(),
    TeammateFeedback.find({ fromUserId: userId, skipped: { $ne: true }, ...ratingEvidenceFilter }).sort({ createdAt: -1 }).limit(80).lean(),
    SteamGame.find({ userId }).sort({ playtimeForeverMinutes: -1 }).limit(120).lean(),
    SteamAchievement.find({ userId }).limit(300).lean(),
    SteamFriend.find({ userId }).limit(80).lean(),
    Lobby.find({
      status: "closed",
      $or: [{ ownerId: userId }, { "currentMembers.userId": userId }]
    })
      .select("game status currentMembers.userId updatedAt")
      .populate({ path: "currentMembers.userId", select: "name", match: { isSuspended: { $ne: true } } })
      .sort({ updatedAt: -1 })
      .limit(40)
      .lean()
  ]);

  return {
    user: { _id: String(userId) },
    profile: userProfile,
    sessions: sessions.map(sanitizeActivityEvidence),
    scorecardAnalyses: scorecards,
    feedbackReceived,
    feedbackGiven,
    steamLibrary,
    steamAchievements,
    friends,
    lobbies
  };
};

const performGraphRebuild = async (userId) => {
  const payload = await loadGraphBundle(userId);
  const result = await rebuildGameplayGraph(payload);
  const data = cleanGraphData(result.data || {});
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
    { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
  );

  return {
    graph,
    warnings: result.warnings || [],
    confidence: result.confidence ?? data.confidence ?? graph.confidence,
    source: result.source || "fallback"
  };
};

const graphRebuildsInFlight = new Map();

export const rebuildGraphForUser = async (userId) => {
  const key = String(userId || "");
  if (!key) throw new Error("Gameplay graph user is invalid.");
  if (graphRebuildsInFlight.has(key)) return graphRebuildsInFlight.get(key);

  const operation = performGraphRebuild(userId);
  graphRebuildsInFlight.set(key, operation);
  try {
    return await operation;
  } finally {
    if (graphRebuildsInFlight.get(key) === operation) graphRebuildsInFlight.delete(key);
  }
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
  const finalGameName = sanitizeText(gameName || session?.gameName, 120);
  const finalGameSlug = sanitizeSlug(gameSlug || session?.gameSlug || finalGameName);

  if (!finalGameSlug || !finalGameName) {
    res.status(400);
    throw new Error("Game is required for scorecard analysis.");
  }
  if (safeLobbyId) {
    const canUseLobby = await Lobby.exists({
      _id: safeLobbyId,
      $or: [{ ownerId: req.user._id }, { "currentMembers.userId": req.user._id }]
    });
    if (!canUseLobby) {
      res.status(403);
      throw new Error("Join this lobby before associating a scorecard with it.");
    }
  }

  const { imageMime, imageSizeBytes } = parseDataUrl(imageDataUrl);
  const cleanedStats = cleanManualStats(manualStats);
  if (!session && !imageDataUrl && !Object.keys(cleanedStats).length) {
    res.status(400);
    throw new Error("Add a scorecard image, manual stats, or a completed tracked session.");
  }
  const { steamContext } = await buildSteamContext(req.user._id, finalGameName);

  const upload = await ScorecardUpload.create({
    userId: req.user._id,
    sessionId: session?._id,
    lobbyId: safeLobbyId,
    gameSlug: finalGameSlug,
    gameName: finalGameName,
    imageMime,
    imageSizeBytes,
    status: "pending"
  });

  try {
    const feedbackDocs = await TeammateFeedback.find({
      toUserId: req.user._id,
      skipped: { $ne: true },
      ...ratingEvidenceFilter
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
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
      session: session ? sanitizeActivityEvidence(session) : {},
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
      summary: (analysisData.summary || []).slice(0, 20),
      warnings: [...(analysisData.warnings || []), ...(analysisResult.warnings || [])].slice(0, 20),
      confidence: analysisData.confidence ?? analysisResult.confidence,
      source: analysisResult.source || "fallback"
    });

    upload.status = "processed";
    upload.processedAt = new Date();
    await upload.save();

    const graph = await rebuildGraphForUser(req.user._id).catch((error) => ({
      graph: null,
      warnings: [`Gameplay graph refresh skipped: ${publicOperationalError(error)}`]
    }));
    const safeUpload = upload.toObject();
    delete safeUpload.imageDataUrl;

    res.status(201).json({
      success: true,
      message: "Scorecard analysis generated",
      data: {
        upload: safeUpload,
        analysis,
        graph: graph.graph,
        warnings: [...(analysisResult.warnings || []), ...(graph.warnings || [])]
      }
    });
  } catch (error) {
    await ScorecardUpload.updateOne(
      { _id: upload._id, status: "pending" },
      {
        $set: {
          status: "failed",
          errorMessage: sanitizeText(error.message || "Scorecard analysis failed.", 500),
          processedAt: new Date()
        },
        $unset: { imageDataUrl: "" }
      }
    ).catch(() => {});
    throw error;
  }
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
  const feedbackItems = (Array.isArray(req.body.feedback) ? req.body.feedback : [req.body]).slice(0, maxFeedbackItems);
  const actionableItems = [
    ...new Map(feedbackItems.filter((item) => item?.toUserId).map((item) => [String(item.toUserId), item])).values()
  ];

  if (!actionableItems.length || booleanInput(req.body.skipped)) {
    const giverGraph = await rebuildGraphForUser(req.user._id);
    return res.json({
      success: true,
      message: "Feedback skipped",
      data: {
        feedback: [],
        graph: giverGraph.graph,
        receiverGraphs: [],
        warnings: giverGraph.warnings || []
      }
    });
  }

  if (isSharedDemoUser(req.user)) {
    res.status(403);
    throw new Error("Shared demo accounts cannot submit teammate feedback.");
  }

  const invalidItem = actionableItems.find((item) => !mongoose.isValidObjectId(item.toUserId));
  if (invalidItem) {
    res.status(400);
    throw new Error("Teammate is invalid.");
  }

  if (actionableItems.some((item) => String(item.toUserId) === String(req.user._id))) {
    res.status(400);
    throw new Error("You cannot submit teammate feedback for yourself.");
  }

  const uniqueToUserIds = [...new Set(actionableItems.map((item) => String(item.toUserId)))];
  const teammateCount = await User.countDocuments({ _id: { $in: uniqueToUserIds }, isSuspended: { $ne: true } });
  if (teammateCount !== uniqueToUserIds.length) {
    res.status(404);
    throw new Error("Teammate not found.");
  }

  const relationshipChecks = await Promise.all(
    uniqueToUserIds.map((toUserId) => canSubmitFeedbackFor(session, req.user._id, toUserId))
  );
  if (relationshipChecks.some((allowed) => !allowed)) {
    res.status(403);
    throw new Error("Feedback can only be submitted for players you have queued with.");
  }

  const feedback = await Promise.all(
    actionableItems.map((item) => {
      const itemSkipped = booleanInput(item.skipped);
      const cleanedRatings = itemSkipped ? {} : cleanRatings(item.ratings || {});
      const safeComment = sanitizeText(item.comment || "", maxCommentLength);
      const requestedPlayAgain = sanitizeText(item.wouldPlayAgain || "", 24).toLowerCase();
      const playAgain = ["yes", "maybe", "no", "skipped"].includes(requestedPlayAgain) ? requestedPlayAgain : "skipped";

      if (!itemSkipped && !Object.keys(cleanedRatings).length && playAgain === "skipped" && !safeComment) {
        const error = new Error("Add a rating, comment, or play-again choice before submitting feedback.");
        error.statusCode = 400;
        throw error;
      }

      return TeammateFeedback.findOneAndUpdate(
        { sessionId: session._id, fromUserId: req.user._id, toUserId: item.toUserId },
        {
          $set: {
            roomId: session.roomId,
            ratings: cleanedRatings,
            wouldPlayAgain: itemSkipped ? "skipped" : playAgain,
            comment: safeComment,
            skipped: itemSkipped
          }
        },
        { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
      );
    })
  );

  const [giverGraph, ...receiverGraphs] = await Promise.all([
    rebuildGraphForUser(req.user._id),
    ...uniqueToUserIds.map((toUserId) => rebuildGraphForUser(toUserId))
  ]);

  res.json({
    success: true,
    message: "Teammate feedback saved",
    data: {
      feedback,
      graph: giverGraph.graph,
      receiverGraph: receiverGraphs[0]?.graph || null,
      receiverGraphs: receiverGraphs.map((item) => item.graph),
      warnings: [...(giverGraph.warnings || []), ...receiverGraphs.flatMap((item) => item.warnings || [])]
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

  if (!graph || graph.gameplayProfileScore === undefined || !graph.style) {
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
    GameActivity.find({ userId: req.user._id, status: "completed" }).sort({ startedAt: -1 }).limit(160).lean(),
    GamePlaytimeAggregate.find({ userId: req.user._id }).sort({ totalMinutes: -1 }).limit(200).lean(),
    SteamGame.find({ userId: req.user._id }).sort({ playtimeForeverMinutes: -1 }).limit(120).lean()
  ]);

  const result = await buildRhythm({
    sessions,
    steamLibrary: steamLibrary.length ? steamLibrary : aggregates,
    steamHeatmap: []
  });

  if (result.data?.summary) {
    await GameplayGraph.updateOne(
      { userId: req.user._id },
      { $set: { rhythmSummary: cleanRhythmSummary(result.data.summary), rhythmUpdatedAt: new Date() } }
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
  let viewerGraphDoc = await GameplayGraph.findOne({ userId: req.user._id }).lean();
  if (!viewerGraphDoc || viewerGraphDoc.gameplayProfileScore === undefined || !viewerGraphDoc.style) {
    viewerGraphDoc = (await rebuildGraphForUser(req.user._id)).graph.toObject();
  }
  const profileRows = await GamerProfile.find({ userId: { $ne: req.user._id } })
    .select("-customAvatar.dataUrl")
    .populate({ path: "userId", select: "name avatar isSuspended", match: { isSuspended: { $ne: true } } })
    .sort({ trustScore: -1, reliabilityScore: -1 })
    .limit(60)
    .lean();
  const profiles = profileRows.filter((profile) => profile.userId).slice(0, 24);
  const candidateUserIds = profiles.map((profile) => profile.userId?._id || profile.userId).filter(Boolean);
  const graphDocs = await GameplayGraph.find({ userId: { $in: candidateUserIds } }).lean();
  const graphByUser = new Map(graphDocs.map((graph) => [String(graph.userId), graph]));
  const candidateGraphs = profiles.map((profile) => graphByUser.get(String(profile.userId?._id || profile.userId)) || {
    userId: profile.userId?._id || profile.userId,
    confidence: 0,
    gameProfiles: []
  });

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
