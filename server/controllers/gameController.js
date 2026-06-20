import Game from "../models/Game.js";
import GameRoom from "../models/GameRoom.js";
import GameActivity from "../models/GameActivity.js";
import GamePlaytimeAggregate from "../models/GamePlaytimeAggregate.js";
import GamerProfile from "../models/GamerProfile.js";
import { gameCatalog, getGameBySlug } from "../data/gameCatalog.js";
import { buildDemoRooms, countDemoRoomPlayers } from "../data/demoGameRooms.js";
import { asyncHandler } from "../middleware/errorMiddleware.js";

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

const enrichGameWithLiveStats = async (game) => {
  const openRooms = await GameRoom.find({ gameSlug: game.slug, status: { $in: ["open", "starting"] } });
  const activePlayers = openRooms.reduce((sum, room) => sum + (room.currentMembers?.length || 0), 0);

  return {
    ...game,
    activeRooms: openRooms.length || game.activeRooms || 0,
    activePlayers: activePlayers || game.activePlayers || 0
  };
};

export const listGames = asyncHandler(async (req, res) => {
  const search = String(req.query.search || "").trim().toLowerCase();
  const genre = String(req.query.genre || "").trim();
  const platform = String(req.query.platform || "").trim();
  const type = String(req.query.type || "").trim();
  const teamSize = Number(req.query.teamSize || 0);
  const minRooms = Number(req.query.minRooms || 0);

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

  let enriched = await Promise.all(games.map(enrichGameWithLiveStats));
  if (minRooms) enriched = enriched.filter((game) => Number(game.activeRooms || 0) >= minRooms);

  res.json({
    success: true,
    message: "Games loaded",
    data: enriched
  });
});

export const getGame = asyncHandler(async (req, res) => {
  const dbGame = await Game.findOne({ slug: req.params.slug, active: true });
  const game = dbGame ? applyCatalogPresentation(toGameObject(dbGame)) : getGameBySlug(req.params.slug);

  if (!game) {
    res.status(404);
    throw new Error("Game not found");
  }

  res.json({
    success: true,
    message: "Game loaded",
    data: await enrichGameWithLiveStats(game)
  });
});

export const getGameRooms = asyncHandler(async (req, res) => {
  const rooms = await GameRoom.find({ gameSlug: req.params.slug, status: { $ne: "cancelled" } })
    .populate("hostId", "name avatar")
    .populate("currentMembers.userId", "name avatar")
    .sort({ status: 1, startsAt: 1, createdAt: -1 })
    .limit(80);
  const dbGame = await Game.findOne({ slug: req.params.slug, active: true });
  const game = dbGame ? toGameObject(dbGame) : getGameBySlug(req.params.slug);
  const demoRooms = rooms.length ? [] : buildDemoRooms(game);

  res.json({
    success: true,
    message: "Game rooms loaded",
    data: rooms.length ? rooms : demoRooms
  });
});

export const getGameStats = asyncHandler(async (req, res) => {
  const [rooms, playtime, dbGame] = await Promise.all([
    GameRoom.find({ gameSlug: req.params.slug, status: { $in: ["open", "starting", "in_game"] } }),
    req.user ? GamePlaytimeAggregate.findOne({ userId: req.user._id, gameSlug: req.params.slug }) : null,
    Game.findOne({ slug: req.params.slug, active: true })
  ]);
  const game = dbGame ? toGameObject(dbGame) : getGameBySlug(req.params.slug);
  const demoRooms = rooms.length ? [] : buildDemoRooms(game);
  const visibleRooms = rooms.length ? rooms : demoRooms;

  res.json({
    success: true,
    message: "Game stats loaded",
    data: {
      activeRooms: visibleRooms.length,
      activePlayers: rooms.length ? rooms.reduce((sum, room) => sum + (room.currentMembers?.length || 0), 0) : countDemoRoomPlayers(demoRooms),
      yourStats: playtime || null
    }
  });
});

export const getTopPlayers = asyncHandler(async (req, res) => {
  const aggregates = await GamePlaytimeAggregate.find({ gameSlug: req.params.slug })
    .populate("userId", "name avatar")
    .sort({ totalMinutes: -1, sessionsCount: -1 })
    .limit(12);
  const userIds = aggregates.map((item) => item.userId?._id || item.userId);
  const profiles = await GamerProfile.find({ userId: { $in: userIds } });
  const profileByUser = new Map(profiles.map((profile) => [String(profile.userId), profile]));

  res.json({
    success: true,
    message: "Top players loaded",
    data: aggregates.map((item) => ({
      user: item.userId,
      profile: profileByUser.get(String(item.userId?._id || item.userId)) || null,
      playtime: item
    }))
  });
});

export const findSquadNow = asyncHandler(async (req, res) => {
  const profile = await GamerProfile.findOne({ userId: req.user._id });
  const rooms = await GameRoom.find({ gameSlug: req.params.slug, status: "open" })
    .populate("hostId", "name avatar")
    .populate("currentMembers.userId", "name avatar")
    .limit(50);

  const scored = rooms
    .map((room) => {
      const alreadyMember = room.currentMembers?.some((member) => String(member.userId?._id || member.userId) === String(req.user._id));
      const missingRoleMatch = room.neededRoles?.some((role) => profile?.games?.[0]?.roles?.includes(role));
      const languageMatch = profile?.languages?.includes(room.language);
      const regionMatch = profile?.region === room.region;
      const micMatch = !room.micRequired || profile?.micAvailable;
      const score =
        (regionMatch ? 30 : 0) +
        (languageMatch ? 22 : 0) +
        (missingRoleMatch ? 18 : 0) +
        (micMatch ? 12 : 0) +
        Math.min(18, Math.max(0, (profile?.trustScore || 70) - (room.trustRequirement || 60)));

      return { room, score, alreadyMember };
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
