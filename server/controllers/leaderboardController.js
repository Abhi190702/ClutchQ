import Game from "../models/Game.js";
import GameRoom from "../models/GameRoom.js";
import GamePlaytimeAggregate from "../models/GamePlaytimeAggregate.js";
import GamerProfile from "../models/GamerProfile.js";
import { gameCatalog } from "../data/gameCatalog.js";
import { asyncHandler } from "../middleware/errorMiddleware.js";

const metricForRange = (range) => {
  if (range === "week") return "weeklyMinutes";
  if (range === "month") return "monthlyMinutes";
  return "totalMinutes";
};

export const getGameLeaderboards = asyncHandler(async (req, res) => {
  const metric = metricForRange(req.query.range);
  const rows = await GamePlaytimeAggregate.aggregate([
    {
      $group: {
        _id: "$gameSlug",
        gameName: { $first: "$gameName" },
        totalMinutes: { $sum: `$${metric}` },
        sessions: { $sum: "$sessionsCount" },
        players: { $addToSet: "$userId" }
      }
    },
    { $sort: { totalMinutes: -1, sessions: -1 } },
    { $limit: 30 }
  ]);

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
  const metric = metricForRange(req.query.range);
  const query = req.query.gameSlug ? { gameSlug: req.query.gameSlug } : {};
  const aggregates = await GamePlaytimeAggregate.find(query)
    .populate("userId", "name avatar")
    .sort({ [metric]: -1, sessionsCount: -1 })
    .limit(30);
  const userIds = aggregates.map((aggregate) => aggregate.userId?._id || aggregate.userId);
  const profiles = await GamerProfile.find({ userId: { $in: userIds } });
  const profileByUser = new Map(profiles.map((profile) => [String(profile.userId), profile]));

  res.json({
    success: true,
    message: "Player leaderboard loaded",
    data: aggregates.map((aggregate, index) => ({
      rank: index + 1,
      user: aggregate.userId,
      profile: profileByUser.get(String(aggregate.userId?._id || aggregate.userId)) || null,
      playtime: aggregate
    }))
  });
});

export const getTrendingGames = asyncHandler(async (req, res) => {
  const rooms = await GameRoom.aggregate([
    { $match: { status: { $in: ["open", "starting", "in_game"] } } },
    {
      $group: {
        _id: "$gameSlug",
        activeRooms: { $sum: 1 },
        activePlayers: { $sum: { $size: "$currentMembers" } }
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
