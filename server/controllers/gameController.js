import Game from "../models/Game.js";
import GameRoom from "../models/GameRoom.js";
import GameActivity from "../models/GameActivity.js";
import GamePlaytimeAggregate from "../models/GamePlaytimeAggregate.js";
import GameplayGraph from "../models/GameplayGraph.js";
import GamerProfile from "../models/GamerProfile.js";
import User from "../models/User.js";
import { gameCatalog, getGameBySlug } from "../data/gameCatalog.js";
import { buildDemoRooms, countDemoRoomPlayers } from "../data/demoGameRooms.js";
import { asyncHandler } from "../middleware/errorMiddleware.js";
import { applyMetadataToGames } from "../services/externalApis/gameMetadataService.js";
import { sanitizeRoomForViewer } from "../utils/roomPrivacy.js";
import { boundedQueryText, boundedSlug } from "../utils/queryInput.js";
import { getGameForContext } from "../utils/rankLogic.js";
import { numberInput } from "../utils/inputValue.js";

const activeRoomStatuses = ["open", "full", "starting", "in_game"];

const toGameObject = (game) => (game?.toObject ? game.toObject() : game);

const applyCatalogPresentation = (game) => {
  const catalogGame = getGameBySlug(game?.slug);
  if (!catalogGame) return game;

  return {
    ...game,
    posterUrl: catalogGame.posterUrl || game.posterUrl,
    coverUrl: catalogGame.coverUrl || game.coverUrl,
    fallbackGradient: catalogGame.fallbackGradient || game.fallbackGradient,
    accentColor: catalogGame.accentColor || game.accentColor
  };
};

const getGamesWithFallback = async (query = {}) => {
  const games = await Game.find({ active: true, ...query }).sort({ activeRooms: -1, title: 1 });
  return games.length ? games.map((game) => applyCatalogPresentation(toGameObject(game))) : gameCatalog;
};

const aggregateVisibleRoomStats = async (slugs) => {
  if (!slugs.length) return [];
  return GameRoom.aggregate([
    { $match: { gameSlug: { $in: slugs }, status: { $in: activeRoomStatuses } } },
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
    }
  ]);
};

const enrichGameWithLiveStats = async (game) => {
  const [stats] = await aggregateVisibleRoomStats([game.slug]);

  return {
    ...game,
    activeRooms: stats?.activeRooms || game.activeRooms || 0,
    activePlayers: stats?.activePlayers || game.activePlayers || 0
  };
};

const enrichGamesWithLiveStats = async (games) => {
  const slugs = games.map((game) => game.slug).filter(Boolean);
  const rows = await aggregateVisibleRoomStats(slugs);
  const statsBySlug = new Map(rows.map((row) => [row._id, row]));

  return games.map((game) => {
    const stats = statsBySlug.get(game.slug);
    return {
      ...game,
      activeRooms: stats?.activeRooms || game.activeRooms || 0,
      activePlayers: stats?.activePlayers || game.activePlayers || 0
    };
  });
};

export const listGames = asyncHandler(async (req, res) => {
  const search = boundedQueryText(req.query.search, 100).toLowerCase();
  const genre = boundedQueryText(req.query.genre, 60);
  const platform = boundedQueryText(req.query.platform, 40);
  const type = boundedQueryText(req.query.type, 60);
  const teamSize = numberInput(req.query.teamSize, 0);
  const minRooms = numberInput(req.query.minRooms, 0);

  let games = await getGamesWithFallback();

  if (search) {
    games = games.filter((game) =>
      [game.title, game.category, game.description, ...(game.genres || [])].join(" ").toLowerCase().includes(search)
    );
  }

  if (genre) games = games.filter((game) => game.genres?.includes(genre));
  if (platform) games = games.filter((game) => game.platforms?.includes(platform));
  if (type) games = games.filter((game) => game.category === type || game.category?.toLowerCase().includes(type.toLowerCase()));
  if (teamSize) games = games.filter((game) => Number(game.teamSize) === teamSize);

  let enriched = await enrichGamesWithLiveStats(games);
  enriched = await applyMetadataToGames(enriched);
  if (minRooms) enriched = enriched.filter((game) => Number(game.activeRooms || 0) >= minRooms);

  res.json({
    success: true,
    message: "Games loaded",
    data: enriched
  });
});

export const getGame = asyncHandler(async (req, res) => {
  const slug = boundedSlug(req.params.slug);
  const dbGame = slug ? await Game.findOne({ slug, active: true }) : null;
  const game = dbGame ? applyCatalogPresentation(toGameObject(dbGame)) : getGameBySlug(slug);

  if (!game) {
    res.status(404);
    throw new Error("Game not found");
  }

  res.json({
    success: true,
    message: "Game loaded",
    data: (await applyMetadataToGames([await enrichGameWithLiveStats(game)]))[0]
  });
});

export const getGameRooms = asyncHandler(async (req, res) => {
  const slug = boundedSlug(req.params.slug);
  const rooms = await GameRoom.find({ gameSlug: slug, status: { $in: activeRoomStatuses } })
    .populate({ path: "hostId", select: "name avatar", match: { isSuspended: { $ne: true } } })
    .populate({ path: "currentMembers.userId", select: "name avatar", match: { isSuspended: { $ne: true } } })
    .sort({ status: 1, startsAt: 1, createdAt: -1 })
    .limit(80);
  const visibleRooms = rooms.filter((room) => room.hostId);
  const dbGame = slug ? await Game.findOne({ slug, active: true }) : null;
  const game = dbGame ? toGameObject(dbGame) : getGameBySlug(slug);
  if (!game) {
    res.status(404);
    throw new Error("Game not found");
  }

  const demoRooms = visibleRooms.length ? [] : buildDemoRooms(game);

  res.json({
    success: true,
    message: "Game rooms loaded",
    data: visibleRooms.length ? visibleRooms.map((room) => sanitizeRoomForViewer(room, null)) : demoRooms
  });
});

export const getGameStats = asyncHandler(async (req, res) => {
  const slug = boundedSlug(req.params.slug);
  const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const monthStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [rooms, playtime, rollingRows, dbGame] = await Promise.all([
    GameRoom.find({ gameSlug: slug, status: { $in: activeRoomStatuses } }),
    req.user ? GamePlaytimeAggregate.findOne({ userId: req.user._id, gameSlug: slug }) : null,
    req.user
      ? GameActivity.aggregate([
          {
            $match: {
              userId: req.user._id,
              gameSlug: slug,
              status: "completed",
              endedAt: { $gte: monthStart }
            }
          },
          {
            $group: {
              _id: null,
              monthlyMinutes: { $sum: "$durationMinutes" },
              weeklyMinutes: { $sum: { $cond: [{ $gte: ["$endedAt", weekStart] }, "$durationMinutes", 0] } }
            }
          }
        ])
      : [],
    Game.findOne({ slug, active: true })
  ]);
  const game = dbGame ? toGameObject(dbGame) : getGameBySlug(slug);
  if (!game) {
    res.status(404);
    throw new Error("Game not found");
  }

  const demoRooms = rooms.length ? [] : buildDemoRooms(game);
  const activeUserIds = new Set(
    (
      await User.find({
        _id: {
          $in: rooms.flatMap((room) => [room.hostId, ...(room.currentMembers || []).map((member) => member.userId)])
        },
        isSuspended: { $ne: true }
      }).distinct("_id")
    ).map(String)
  );
  const visibleLiveRooms = rooms.filter((room) => activeUserIds.has(String(room.hostId)));
  const visibleRooms = visibleLiveRooms.length ? visibleLiveRooms : demoRooms;

  res.json({
    success: true,
    message: "Game stats loaded",
    data: {
      activeRooms: visibleRooms.length,
      activePlayers: visibleLiveRooms.length
        ? visibleLiveRooms.reduce(
            (sum, room) =>
              sum +
              (room.currentMembers || []).filter(
                (member) => member.status !== "left" && activeUserIds.has(String(member.userId))
              ).length,
            0
          )
        : countDemoRoomPlayers(demoRooms),
      yourStats: playtime
        ? {
            ...playtime.toObject(),
            weeklyMinutes: rollingRows[0]?.weeklyMinutes || 0,
            monthlyMinutes: rollingRows[0]?.monthlyMinutes || 0
          }
        : null
    }
  });
});

export const getTopPlayers = asyncHandler(async (req, res) => {
  const slug = boundedSlug(req.params.slug);
  const game = (slug ? await Game.findOne({ slug, active: true }) : null) || getGameBySlug(slug);
  if (!game) {
    res.status(404);
    throw new Error("Game not found");
  }

  const aggregates = await GamePlaytimeAggregate.find({ gameSlug: slug })
    .populate({ path: "userId", select: "name avatar", match: { isSuspended: { $ne: true } } })
    .sort({ totalMinutes: -1, sessionsCount: -1 })
    .limit(12);
  const userIds = aggregates.map((item) => item.userId?._id || item.userId);
  const profiles = await GamerProfile.find({ userId: { $in: userIds } }).select("-customAvatar.dataUrl");
  const profileByUser = new Map(profiles.map((profile) => [String(profile.userId), profile]));

  res.json({
    success: true,
    message: "Top players loaded",
    data: aggregates.filter((item) => item.userId).map((item) => ({
      user: item.userId,
      profile: profileByUser.get(String(item.userId?._id || item.userId)) || null,
      playtime: item
    }))
  });
});

export const findSquadNow = asyncHandler(async (req, res) => {
  const slug = boundedSlug(req.params.slug);
  const game = (slug ? await Game.findOne({ slug, active: true }) : null) || getGameBySlug(slug);
  if (!game) {
    res.status(404);
    throw new Error("Game not found");
  }

  const profile = await GamerProfile.findOne({ userId: req.user._id });
  if (!profile) {
    res.status(400);
    throw new Error("Complete your gamer profile before finding a squad.");
  }
  const viewerGraph = await GameplayGraph.findOne({ userId: req.user._id }).lean();
  const graphGame = (viewerGraph?.gameProfiles || []).find((item) => item.gameSlug === slug || item.gameName === game.title);
  const profileGame = getGameForContext(profile, game.title);
  const rooms = await GameRoom.find({ gameSlug: slug, status: "open" })
    .populate({ path: "hostId", select: "name avatar", match: { isSuspended: { $ne: true } } })
    .populate({ path: "currentMembers.userId", select: "name avatar", match: { isSuspended: { $ne: true } } })
    .limit(50);

  const scored = rooms
    .filter((room) => room.hostId)
    .map((room) => {
      const alreadyMember = room.currentMembers?.some((member) => String(member.userId?._id || member.userId) === String(req.user._id));
      const profileRoles = new Set((profileGame?.roles || []).map((role) => String(role).trim().toLowerCase()));
      const missingRoleMatch = room.neededRoles?.some((role) => profileRoles.has(String(role).trim().toLowerCase()));
      const languageMatch = profile?.languages?.some(
        (language) => String(language).trim().toLowerCase() === String(room.language || "").trim().toLowerCase()
      );
      const regionMatch = String(profile?.region || "").trim().toLowerCase() === String(room.region || "").trim().toLowerCase();
      const micMatch = !room.micRequired || profile?.micAvailable;
      const graphRating = Number(graphGame?.averageRating);
      const graphGameBonus = Number.isFinite(graphRating) ? Math.min(12, Math.max(0, Math.round((graphRating - 55) / 3))) : 0;
      const graphConfidenceBonus = viewerGraph?.confidence >= 0.65 ? 4 : 0;
      const score =
        (regionMatch ? 30 : 0) +
        (languageMatch ? 22 : 0) +
        (missingRoleMatch ? 18 : 0) +
        (micMatch ? 12 : 0) +
        Math.min(18, Math.max(0, (Number(profile.trustScore) || 0) - (room.trustRequirement || 60))) +
        graphGameBonus +
        graphConfidenceBonus;

      return {
        room: sanitizeRoomForViewer(room, req.user._id),
        score: Math.min(100, Math.round(score)),
        alreadyMember,
        graphReasons: [
          graphGame ? "Gameplay Graph has history in this game" : null,
          graphConfidenceBonus ? "High confidence graph" : null
        ].filter(Boolean)
      };
    })
    .filter((item) => !item.alreadyMember)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  res.json({
    success: true,
    message: scored.length ? "Best rooms found" : "No perfect room yet. Create one and let others join.",
    data: scored
  });
});
