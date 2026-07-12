import Game from "../models/Game.js";
import GameRoom from "../models/GameRoom.js";
import GamePlaytimeAggregate from "../models/GamePlaytimeAggregate.js";
import GameActivity from "../models/GameActivity.js";
import GamerProfile from "../models/GamerProfile.js";
import User from "../models/User.js";
import { gameCatalog } from "../data/gameCatalog.js";
import { asyncHandler } from "../middleware/errorMiddleware.js";
import { boundedSlug } from "../utils/queryInput.js";

const normalizeRange = (value) => (value === "week" || value === "month" ? value : "all");
const rangeStart = (range) => {
  if (range === "week") return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  if (range === "month") return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  return null;
};

const activeUserLookup = [
  {
    $lookup: {
      from: User.collection.name,
      localField: "userId",
      foreignField: "_id",
      as: "activeAccount"
    }
  },
  { $match: { "activeAccount.0": { $exists: true }, "activeAccount.isSuspended": { $ne: true } } }
];

const gameRowsForRange = (range) => {
  const start = rangeStart(range);
  if (!start) {
    return GamePlaytimeAggregate.aggregate([
      ...activeUserLookup,
      {
        $group: {
          _id: "$gameSlug",
          gameName: { $first: "$gameName" },
          totalMinutes: { $sum: "$totalMinutes" },
          sessions: { $sum: "$sessionsCount" },
          players: { $addToSet: "$userId" }
        }
      },
      { $sort: { totalMinutes: -1, sessions: -1 } },
      { $limit: 30 }
    ]);
  }

  return GameActivity.aggregate([
    { $match: { status: "completed", endedAt: { $gte: start } } },
    ...activeUserLookup,
    {
      $group: {
        _id: "$gameSlug",
        gameName: { $first: "$gameName" },
        totalMinutes: { $sum: "$durationMinutes" },
        sessions: { $sum: 1 },
        players: { $addToSet: "$userId" }
      }
    },
    { $sort: { totalMinutes: -1, sessions: -1 } },
    { $limit: 30 }
  ]);
};

const playerRowsForRange = (range, gameSlug) => {
  const start = rangeStart(range);
  if (!start) {
    return GamePlaytimeAggregate.aggregate([
      { $match: gameSlug ? { gameSlug } : {} },
      ...activeUserLookup,
      {
        $group: {
          _id: "$userId",
          totalMinutes: { $sum: "$totalMinutes" },
          sessionsCount: { $sum: "$sessionsCount" },
          lastPlayedAt: { $max: "$lastPlayedAt" }
        }
      },
      { $sort: { totalMinutes: -1, sessionsCount: -1 } },
      { $limit: 100 }
    ]);
  }

  return GameActivity.aggregate([
    {
      $match: {
        status: "completed",
        endedAt: { $gte: start },
        ...(gameSlug ? { gameSlug } : {})
      }
    },
    ...activeUserLookup,
    {
      $group: {
        _id: "$userId",
        totalMinutes: { $sum: "$durationMinutes" },
        sessionsCount: { $sum: 1 },
        lastPlayedAt: { $max: "$endedAt" }
      }
    },
    { $sort: { totalMinutes: -1, sessionsCount: -1 } },
    { $limit: 100 }
  ]);
};

export const getGameLeaderboards = asyncHandler(async (req, res) => {
  const rows = await gameRowsForRange(normalizeRange(req.query.range));

  const games = await Game.find({ slug: { $in: rows.map((row) => row._id) } });
  const gameBySlug = new Map([...gameCatalog, ...games.map((game) => game.toObject())].map((game) => [game.slug, game]));

  res.json({
    success: true,
    message: "Game leaderboard loaded",
    data: rows.map((row, index) => ({
      rank: index + 1,
      game: gameBySlug.get(row._id) || { slug: row._id, title: row.gameName },
      totalMinutes: row.totalMinutes,
      sessions: row.sessions,
      activePlayers: row.players.length
    }))
  });
});

export const getPlayerLeaderboards = asyncHandler(async (req, res) => {
  const gameSlug = boundedSlug(req.query.gameSlug);
  const rows = await playerRowsForRange(normalizeRange(req.query.range), gameSlug);
  const userIds = rows.map((row) => row._id);
  const users = await User.find({ _id: { $in: userIds }, isSuspended: { $ne: true } }).select("name avatar").lean();
  const userById = new Map(users.map((user) => [String(user._id), user]));
  const profiles = await GamerProfile.find({ userId: { $in: userIds } }).select("-customAvatar.dataUrl");
  const profileByUser = new Map(profiles.map((profile) => [String(profile.userId), profile]));
  const visibleRows = rows.filter((row) => userById.has(String(row._id))).slice(0, 30);

  res.json({
    success: true,
    message: "Player leaderboard loaded",
    data: visibleRows.map((row, index) => ({
      rank: index + 1,
      user: userById.get(String(row._id)),
      profile: profileByUser.get(String(row._id)) || null,
      playtime: {
        userId: row._id,
        totalMinutes: row.totalMinutes,
        sessionsCount: row.sessionsCount,
        lastPlayedAt: row.lastPlayedAt
      }
    }))
  });
});

export const getTrendingGames = asyncHandler(async (req, res) => {
  const rooms = await GameRoom.aggregate([
    { $match: { status: { $in: ["open", "full", "starting", "in_game"] } } },
    {
      $lookup: {
        from: User.collection.name,
        localField: "hostId",
        foreignField: "_id",
        as: "activeHost"
      }
    },
    { $match: { "activeHost.0": { $exists: true }, "activeHost.isSuspended": { $ne: true } } },
    { $unwind: { path: "$currentMembers", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: User.collection.name,
        localField: "currentMembers.userId",
        foreignField: "_id",
        as: "activeMember"
      }
    },
    {
      $group: {
        _id: "$_id",
        gameSlug: { $first: "$gameSlug" },
        activePlayers: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $gt: [{ $size: "$activeMember" }, 0] },
                  { $ne: ["$currentMembers.status", "left"] },
                  { $not: [{ $in: [true, "$activeMember.isSuspended"] }] }
                ]
              },
              1,
              0
            ]
          }
        }
      }
    },
    {
      $group: {
        _id: "$gameSlug",
        activeRooms: { $sum: 1 },
        activePlayers: { $sum: "$activePlayers" }
      }
    },
    { $sort: { activeRooms: -1, activePlayers: -1 } },
    { $limit: 12 }
  ]);
  const games = await Game.find({ slug: { $in: rooms.map((room) => room._id) } });
  const gameBySlug = new Map([...gameCatalog, ...games.map((game) => game.toObject())].map((game) => [game.slug, game]));

  res.json({
    success: true,
    message: "Trending games loaded",
    data: rooms.map((room, index) => ({
      rank: index + 1,
      game: gameBySlug.get(room._id) || { slug: room._id, title: room._id },
      activeRooms: room.activeRooms,
      activePlayers: room.activePlayers
    }))
  });
});
