import Game from "../models/Game.js";
import GameActivity from "../models/GameActivity.js";
import GamePlaytimeAggregate from "../models/GamePlaytimeAggregate.js";
import MatchAnalysis from "../models/MatchAnalysis.js";
import { getGameBySlug } from "../data/gameCatalog.js";
import { asyncHandler } from "../middleware/errorMiddleware.js";
import { rebuildGraphForUser } from "./intelligenceController.js";

const minutesBetween = (start, end) => Math.max(1, Math.round((new Date(end) - new Date(start)) / 60000));
const clampScore = (value) => Math.max(0, Math.min(100, Math.round(value)));

const getGameInfo = async (slug) => {
  const game = await Game.findOne({ slug });
  return game || getGameBySlug(slug);
};

const calculateMatchRating = ({ game, teamworkScore = 70, communicationScore = 70, reliabilityScore = 80, performanceScore = 70 }) => {
  const category = game?.category || "";
  const fps = category.includes("FPS") || game?.genres?.includes("FPS");
  const coop = game?.genres?.includes("Co-op");
  const social = game?.genres?.includes("Social Deduction");

  if (fps) {
    return clampScore(teamworkScore * 0.24 + communicationScore * 0.22 + reliabilityScore * 0.18 + performanceScore * 0.28 + 8);
  }

  if (coop) {
    return clampScore(teamworkScore * 0.36 + communicationScore * 0.3 + reliabilityScore * 0.2 + performanceScore * 0.08 + 6);
  }

  if (social) {
    return clampScore(teamworkScore * 0.24 + communicationScore * 0.36 + reliabilityScore * 0.26 + performanceScore * 0.04 + 6);
  }

  return clampScore(teamworkScore * 0.3 + communicationScore * 0.25 + reliabilityScore * 0.2 + performanceScore * 0.15 + 10);
};

const createAnalysis = async (activity, game) => {
  const rating = calculateMatchRating({ game, ...activity.toObject() });
  const highlights = [];
  const improvementAreas = [];

  if (activity.teamworkScore >= 75) highlights.push("Strong team coordination");
  if (activity.communicationScore >= 75) highlights.push("Clear communication");
  if (activity.performanceScore >= 75) highlights.push("High-impact gameplay");
  if (activity.teamworkScore < 60) improvementAreas.push("Tighter role coordination");
  if (activity.communicationScore < 60) improvementAreas.push("Cleaner callouts");
  if (activity.performanceScore < 60) improvementAreas.push("More consistent execution");

  return MatchAnalysis.create({
    userId: activity.userId,
    gameSlug: activity.gameSlug,
    gameName: activity.gameName,
    roomId: activity.roomId,
    activityId: activity._id,
    category: game?.category,
    matchRating: rating,
    teamworkScore: activity.teamworkScore,
    communicationScore: activity.communicationScore,
    reliabilityScore: activity.reliabilityScore,
    performanceScore: activity.performanceScore,
    trustImpact: clampScore((rating - 70) / 5),
    highlights: highlights.length ? highlights : ["Session completed reliably"],
    improvementAreas: improvementAreas.length ? improvementAreas : ["Keep the same consistency next session"],
    sourceBreakdown: {
      teamwork: "manual rating",
      communication: "manual rating",
      reliability: "session completion",
      performance: "manual rating"
    }
  });
};

const updateAggregate = async (activity) => {
  const aggregate = await GamePlaytimeAggregate.findOneAndUpdate(
    { userId: activity.userId, gameSlug: activity.gameSlug },
    {
      $setOnInsert: {
        gameName: activity.gameName,
        userId: activity.userId,
        gameSlug: activity.gameSlug
      },
      $inc: {
        totalMinutes: activity.durationMinutes,
        weeklyMinutes: activity.durationMinutes,
        monthlyMinutes: activity.durationMinutes,
        sessionsCount: 1
      },
      $max: {
        lastPlayedAt: activity.endedAt || activity.updatedAt
      }
    },
    { new: true, upsert: true }
  );

  return aggregate;
};

export const startActivity = asyncHandler(async (req, res) => {
  const { gameSlug, roomId } = req.body;

  if (!gameSlug) {
    res.status(400);
    throw new Error("Game is required");
  }

  const existing = await GameActivity.findOne({ userId: req.user._id, status: "active" });
  if (existing) {
    return res.json({
      success: true,
      message: "Active session already running",
      data: existing
    });
  }

  const game = await getGameInfo(gameSlug);
  if (!game) {
    res.status(404);
    throw new Error("Game not found");
  }

  const activity = await GameActivity.create({
    userId: req.user._id,
    gameId: game._id,
    gameSlug,
    gameName: game.title,
    roomId,
    source: "manual",
    status: "active",
    startedAt: new Date()
  });

  res.status(201).json({
    success: true,
    message: "Playing session started",
    data: activity
  });
});

export const stopActivity = asyncHandler(async (req, res) => {
  const activity = await GameActivity.findOne({ _id: req.params.id, userId: req.user._id });

  if (!activity) {
    res.status(404);
    throw new Error("Activity not found");
  }

  if (activity.status !== "active") {
    res.status(400);
    throw new Error("This activity is already completed");
  }

  const endedAt = new Date();
  const game = await getGameInfo(activity.gameSlug);

  activity.endedAt = endedAt;
  activity.durationMinutes = minutesBetween(activity.startedAt, endedAt);
  activity.status = "completed";
  activity.result = req.body.result || "completed";
  activity.teamworkScore = Number(req.body.teamworkScore) || 75;
  activity.communicationScore = Number(req.body.communicationScore) || 75;
  activity.reliabilityScore = 90;
  activity.performanceScore = Number(req.body.performanceScore) || 75;
  activity.matchRating = calculateMatchRating({ game, ...activity.toObject() });
  activity.notes = req.body.notes;
  await activity.save();

  const [aggregate, analysis] = await Promise.all([updateAggregate(activity), createAnalysis(activity, game)]);
  const graphRefresh = await rebuildGraphForUser(req.user._id).catch((error) => ({
    graph: null,
    warnings: [`Gameplay graph refresh skipped: ${error.message}`]
  }));

  res.json({
    success: true,
    message: "Playing session ended",
    data: {
      activity,
      aggregate,
      analysis,
      gameplayGraph: graphRefresh.graph,
      warnings: graphRefresh.warnings || []
    }
  });
});

export const getMyActivity = asyncHandler(async (req, res) => {
  const activities = await GameActivity.find({ userId: req.user._id }).sort({ startedAt: -1 }).limit(50);

  res.json({
    success: true,
    message: "Activity loaded",
    data: activities
  });
});

export const getActiveActivity = asyncHandler(async (req, res) => {
  const activity = await GameActivity.findOne({ userId: req.user._id, status: "active" });

  res.json({
    success: true,
    message: "Active activity loaded",
    data: activity
  });
});

export const getGameActivity = asyncHandler(async (req, res) => {
  const activities = await GameActivity.find({ userId: req.user._id, gameSlug: req.params.slug }).sort({ startedAt: -1 }).limit(30);

  res.json({
    success: true,
    message: "Game activity loaded",
    data: activities
  });
});

export const getMyActivitySummary = asyncHandler(async (req, res) => {
  const [aggregates, active, recentAnalysis] = await Promise.all([
    GamePlaytimeAggregate.find({ userId: req.user._id }).sort({ totalMinutes: -1 }),
    GameActivity.findOne({ userId: req.user._id, status: "active" }),
    MatchAnalysis.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(8)
  ]);

  res.json({
    success: true,
    message: "Activity summary loaded",
    data: {
      aggregates,
      active,
      recentAnalysis
    }
  });
});
