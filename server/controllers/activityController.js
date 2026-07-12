import mongoose from "mongoose";
import Game from "../models/Game.js";
import GameActivity from "../models/GameActivity.js";
import GamePlaytimeAggregate from "../models/GamePlaytimeAggregate.js";
import GameRoom from "../models/GameRoom.js";
import MatchAnalysis from "../models/MatchAnalysis.js";
import { getGameBySlug } from "../data/gameCatalog.js";
import { asyncHandler } from "../middleware/errorMiddleware.js";
import { rebuildGraphForUser } from "./intelligenceController.js";
import { boundedSlug } from "../utils/queryInput.js";
import { publicOperationalError } from "../utils/publicError.js";
import { cleanTextInput, numberInput } from "../utils/inputValue.js";

const maxTrackedSessionMinutes = 24 * 60;
const maxTrackedSessionMs = maxTrackedSessionMinutes * 60 * 1000;
const minutesBetween = (start, end) => Math.min(maxTrackedSessionMinutes, Math.max(1, Math.round((new Date(end) - new Date(start)) / 60000)));
const clampScore = (value) => Math.max(0, Math.min(100, Math.round(value)));
const parseScore = (value, label) => {
  if (value === undefined || value === null || value === "") return undefined;
  const number = numberInput(value);
  if (number === undefined || number < 0 || number > 100) {
    const error = new Error(`${label} must be between 0 and 100.`);
    error.statusCode = 400;
    throw error;
  }
  return clampScore(number);
};
const activityResults = new Set(["win", "loss", "completed", "unknown"]);
const trackableRoomStatuses = ["open", "full", "starting", "in_game"];

const expireStaleActivitiesForUser = (userId) =>
  GameActivity.updateMany(
    {
      userId,
      status: "active",
      startedAt: { $lt: new Date(Date.now() - maxTrackedSessionMs) }
    },
    {
      $set: {
        status: "cancelled",
        endedAt: new Date(),
        durationMinutes: 0,
        notes: "Automatically expired after 24 hours."
      },
      $unset: { matchRating: "" }
    }
  );

const rollingPlaytimeByGame = (userId) => {
  const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const monthStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  return GameActivity.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId), status: "completed", endedAt: { $gte: monthStart } } },
    {
      $group: {
        _id: "$gameSlug",
        monthlyMinutes: { $sum: "$durationMinutes" },
        weeklyMinutes: {
          $sum: { $cond: [{ $gte: ["$endedAt", weekStart] }, "$durationMinutes", 0] }
        }
      }
    }
  ]);
};

const getGameInfo = async (slug) => {
  const game = await Game.findOne({ slug });
  return game || getGameBySlug(slug);
};

const calculateMatchRating = ({ game, teamworkScore, communicationScore, reliabilityScore, performanceScore }) => {
  const category = game?.category || "";
  const fps = category.includes("FPS") || game?.genres?.includes("FPS");
  const coop = game?.genres?.includes("Co-op");
  const social = game?.genres?.includes("Social Deduction");

  const weights = fps
    ? { teamworkScore: 0.26, communicationScore: 0.24, reliabilityScore: 0.2, performanceScore: 0.3 }
    : coop
      ? { teamworkScore: 0.38, communicationScore: 0.32, reliabilityScore: 0.2, performanceScore: 0.1 }
      : social
        ? { teamworkScore: 0.26, communicationScore: 0.38, reliabilityScore: 0.28, performanceScore: 0.08 }
        : { teamworkScore: 0.33, communicationScore: 0.28, reliabilityScore: 0.22, performanceScore: 0.17 };
  const values = { teamworkScore, communicationScore, reliabilityScore, performanceScore };
  const known = Object.entries(weights).filter(([key]) => Number.isFinite(values[key]));
  if (!known.length) return null;
  const totalWeight = known.reduce((sum, [, weight]) => sum + weight, 0);
  return clampScore(known.reduce((sum, [key, weight]) => sum + values[key] * weight, 0) / totalWeight);
};

const createAnalysis = async (activity, game) => {
  const rating = calculateMatchRating({ game, ...activity.toObject() });
  const highlights = [];
  const improvementAreas = [];

  if (Number.isFinite(activity.teamworkScore) && activity.teamworkScore >= 75) highlights.push("Strong team coordination");
  if (Number.isFinite(activity.communicationScore) && activity.communicationScore >= 75) highlights.push("Clear communication");
  if (Number.isFinite(activity.performanceScore) && activity.performanceScore >= 75) highlights.push("High-impact gameplay");
  if (Number.isFinite(activity.teamworkScore) && activity.teamworkScore < 60) improvementAreas.push("Tighter role coordination");
  if (Number.isFinite(activity.communicationScore) && activity.communicationScore < 60) improvementAreas.push("Cleaner callouts");
  if (Number.isFinite(activity.performanceScore) && activity.performanceScore < 60) improvementAreas.push("More consistent execution");
  const hasManualRatings = [activity.teamworkScore, activity.communicationScore, activity.performanceScore].some(Number.isFinite);

  return MatchAnalysis.findOneAndUpdate(
    { activityId: activity._id },
    {
      $set: {
        userId: activity.userId,
        gameSlug: activity.gameSlug,
        gameName: activity.gameName,
        roomId: activity.roomId,
        category: game?.category,
        ...(rating === null ? {} : { matchRating: rating }),
        teamworkScore: activity.teamworkScore,
        communicationScore: activity.communicationScore,
        reliabilityScore: activity.reliabilityScore,
        performanceScore: activity.performanceScore,
        trustImpact: rating === null ? 0 : Math.round((rating - 70) / 5),
        highlights: highlights.length ? highlights : [hasManualRatings ? "Session ratings recorded" : "Session tracked without manual ratings"],
        improvementAreas: improvementAreas.length ? improvementAreas : [hasManualRatings ? "Keep building consistent evidence" : "Add ratings for a stronger match analysis"],
        sourceBreakdown: {
          ...(Number.isFinite(activity.teamworkScore) ? { teamwork: "manual rating" } : {}),
          ...(Number.isFinite(activity.communicationScore) ? { communication: "manual rating" } : {}),
          ...(Number.isFinite(activity.reliabilityScore) ? { reliability: "manual rating" } : {}),
          ...(Number.isFinite(activity.performanceScore) ? { performance: "manual rating" } : {})
        }
      },
      $setOnInsert: { activityId: activity._id },
      ...(rating === null ? { $unset: { matchRating: "" } } : {})
    },
    { new: true, upsert: true, runValidators: true }
  );
};

const rebuildAggregate = async (activity) => {
  const [totals] = await GameActivity.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(activity.userId),
        gameSlug: activity.gameSlug,
        status: "completed"
      }
    },
    {
      $group: {
        _id: null,
        totalMinutes: { $sum: "$durationMinutes" },
        sessionsCount: { $sum: 1 },
        lastPlayedAt: { $max: "$endedAt" },
        gameName: { $last: "$gameName" }
      }
    }
  ]);

  if (!totals) return null;
  const aggregate = await GamePlaytimeAggregate.findOneAndUpdate(
    { userId: activity.userId, gameSlug: activity.gameSlug },
    {
      $set: {
        gameName: totals.gameName || activity.gameName,
        userId: activity.userId,
        gameSlug: activity.gameSlug,
        totalMinutes: totals.totalMinutes,
        sessionsCount: totals.sessionsCount,
        lastPlayedAt: totals.lastPlayedAt || activity.endedAt || activity.updatedAt
      }
    },
    { new: true, upsert: true, runValidators: true }
  );

  return aggregate;
};

export const startActivity = asyncHandler(async (req, res) => {
  const gameSlug = boundedSlug(req.body.gameSlug);
  const { roomId } = req.body;

  if (!gameSlug) {
    res.status(400);
    throw new Error("Game is required");
  }

  let existing = await GameActivity.findOne({ userId: req.user._id, status: "active" });
  if (existing) {
    if (Date.now() - new Date(existing.startedAt).getTime() > maxTrackedSessionMs) {
      await GameActivity.updateOne(
        { _id: existing._id, userId: req.user._id, status: "active" },
        {
          $set: {
            status: "cancelled",
            endedAt: new Date(),
            durationMinutes: 0,
            notes: "Automatically expired after 24 hours."
          },
          $unset: { matchRating: "" }
        }
      );
      existing = null;
    }
  }
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

  let verifiedRoomId;
  if (roomId) {
    if (!mongoose.isValidObjectId(roomId)) {
      res.status(400);
      throw new Error("Invalid game room.");
    }
    const room = await GameRoom.findOne({
      _id: roomId,
      gameSlug,
      status: { $in: trackableRoomStatuses },
      $or: [
        { hostId: req.user._id },
        { currentMembers: { $elemMatch: { userId: req.user._id, status: { $ne: "left" } } } }
      ]
    }).select("_id");
    if (!room) {
      res.status(403);
      throw new Error("Join this game room before tracking its session.");
    }
    verifiedRoomId = room._id;
  }

  let activity;
  try {
    activity = await GameActivity.create({
      userId: req.user._id,
      gameId: game._id,
      gameSlug,
      gameName: game.title,
      roomId: verifiedRoomId,
      source: "manual",
      status: "active",
      startedAt: new Date()
    });
  } catch (error) {
    if (error?.code !== 11000) throw error;
    activity = await GameActivity.findOne({ userId: req.user._id, status: "active" });
    return res.json({ success: true, message: "Active session already running", data: activity });
  }

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

  if (activity.status !== "active" && activity.status !== "completed") {
    res.status(409);
    throw new Error("This activity cannot be completed.");
  }

  const result = cleanTextInput(req.body.result || "completed", 20).toLowerCase();
  if (!activityResults.has(result)) {
    res.status(400);
    throw new Error("Invalid activity result.");
  }

  const game = await getGameInfo(activity.gameSlug);
  let updatedActivity = activity;
  if (activity.status === "active") {
    const endedAt = new Date();
    if (endedAt.getTime() - new Date(activity.startedAt).getTime() > maxTrackedSessionMs) {
      const expired = await GameActivity.findOneAndUpdate(
        { _id: activity._id, userId: req.user._id, status: "active" },
        {
          $set: {
            endedAt,
            durationMinutes: 0,
            status: "cancelled",
            notes: "Automatically expired after 24 hours."
          },
          $unset: { matchRating: "" }
        },
        { new: true, runValidators: true }
      );
      return res.json({
        success: true,
        message: "This session expired after 24 hours and was not counted.",
        data: { activity: expired }
      });
    }
    const scores = {
      teamworkScore: parseScore(req.body.teamworkScore, "Teamwork score"),
      communicationScore: parseScore(req.body.communicationScore, "Communication score"),
      reliabilityScore: parseScore(req.body.reliabilityScore, "Reliability score"),
      performanceScore: parseScore(req.body.performanceScore, "Performance score")
    };
    const matchRating = calculateMatchRating({ game, ...scores });
    const suppliedScores = Object.fromEntries(Object.entries(scores).filter(([, value]) => value !== undefined));
    const completionValues = {
      endedAt,
      durationMinutes: minutesBetween(activity.startedAt, endedAt),
      status: "completed",
      result,
      ...suppliedScores,
      notes: cleanTextInput(req.body.notes, 500)
    };
    if (matchRating !== null) completionValues.matchRating = matchRating;
    updatedActivity = await GameActivity.findOneAndUpdate(
      { _id: activity._id, userId: req.user._id, status: "active" },
      {
        $set: completionValues,
        ...(matchRating === null ? { $unset: { matchRating: "" } } : {})
      },
      { new: true, runValidators: true }
    );

    if (!updatedActivity) {
      updatedActivity = await GameActivity.findOne({ _id: activity._id, userId: req.user._id, status: "completed" });
    }
  }

  if (!updatedActivity) {
    res.status(409);
    throw new Error("This activity could not be completed.");
  }

  const hasRatingEvidence = [
    updatedActivity.teamworkScore,
    updatedActivity.communicationScore,
    updatedActivity.reliabilityScore,
    updatedActivity.performanceScore
  ].some(Number.isFinite);
  if (!hasRatingEvidence && updatedActivity.matchRating !== undefined) {
    await GameActivity.updateOne({ _id: updatedActivity._id }, { $unset: { matchRating: "" } });
    updatedActivity = await GameActivity.findById(updatedActivity._id);
  }

  const [aggregate, analysis] = await Promise.all([rebuildAggregate(updatedActivity), createAnalysis(updatedActivity, game)]);
  const graphRefresh = await rebuildGraphForUser(req.user._id).catch((error) => ({
    graph: null,
    warnings: [`Gameplay graph refresh skipped: ${publicOperationalError(error)}`]
  }));

  res.json({
    success: true,
    message: activity.status === "completed" ? "Playing session was already completed; derived data was refreshed" : "Playing session ended",
    data: {
      activity: updatedActivity,
      aggregate,
      analysis,
      gameplayGraph: graphRefresh.graph,
      warnings: graphRefresh.warnings || []
    }
  });
});

export const getMyActivity = asyncHandler(async (req, res) => {
  await expireStaleActivitiesForUser(req.user._id);
  const activities = await GameActivity.find({ userId: req.user._id }).sort({ startedAt: -1 }).limit(50);

  res.json({
    success: true,
    message: "Activity loaded",
    data: activities
  });
});

export const getActiveActivity = asyncHandler(async (req, res) => {
  await expireStaleActivitiesForUser(req.user._id);
  const activity = await GameActivity.findOne({ userId: req.user._id, status: "active" });

  res.json({
    success: true,
    message: "Active activity loaded",
    data: activity
  });
});

export const getGameActivity = asyncHandler(async (req, res) => {
  const gameSlug = boundedSlug(req.params.slug);
  const activities = gameSlug
    ? await GameActivity.find({ userId: req.user._id, gameSlug }).sort({ startedAt: -1 }).limit(30)
    : [];

  res.json({
    success: true,
    message: "Game activity loaded",
    data: activities
  });
});

export const getMyActivitySummary = asyncHandler(async (req, res) => {
  await expireStaleActivitiesForUser(req.user._id);
  const [aggregates, rollingRows, active, recentAnalysis] = await Promise.all([
    GamePlaytimeAggregate.find({ userId: req.user._id }).sort({ totalMinutes: -1 }),
    rollingPlaytimeByGame(req.user._id),
    GameActivity.findOne({ userId: req.user._id, status: "active" }),
    MatchAnalysis.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(8)
  ]);
  const rollingByGame = new Map(rollingRows.map((row) => [row._id, row]));
  const currentAggregates = aggregates.map((aggregate) => {
    const data = aggregate.toObject();
    const rolling = rollingByGame.get(data.gameSlug);
    return {
      ...data,
      weeklyMinutes: rolling?.weeklyMinutes || 0,
      monthlyMinutes: rolling?.monthlyMinutes || 0
    };
  });

  res.json({
    success: true,
    message: "Activity summary loaded",
    data: {
      aggregates: currentAggregates,
      active,
      recentAnalysis
    }
  });
});
