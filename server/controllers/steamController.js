import { asyncHandler } from "../middleware/errorMiddleware.js";
import {
  calculatePlayerScore,
  getAchievementSummaryForUser,
  getFavoriteGamesForUser,
  getHeatmapForUser,
  getMatchInsightsForUser,
  getSteamFriendsForUser,
  getSteamIdentityForUser,
  getSteamLibraryForUser,
  getSteamRecentForUser,
  getSteamSyncStatusForUser,
  syncSteamForUser,
  SteamServiceError
} from "../services/steamService.js";
import { rebuildGraphForUser } from "./intelligenceController.js";

const sendSteamError = (res, error) => {
  if (error instanceof SteamServiceError) {
    return res.status(error.statusCode || 502).json({
      success: false,
      message: error.message,
      requestId: res.req?.id,
      data: { section: error.section }
    });
  }

  return res.status(500).json({
    success: false,
    message: "Steam is unavailable right now. Try again later.",
    requestId: res.req?.id
  });
};

export const getSteamMe = asyncHandler(async (req, res) => {
  const data = await getSteamIdentityForUser(req.user);
  res.json({ success: true, message: "Steam identity loaded", data });
});

export const syncSteam = asyncHandler(async (req, res) => {
  try {
    const result = await syncSteamForUser(req.user);
    const graphRefresh = await rebuildGraphForUser(req.user._id).catch((error) => ({
      graph: null,
      warnings: [`Gameplay graph refresh skipped: ${error.message}`]
    }));
    res.json({
      success: true,
      message: result.message || "Steam synced successfully.",
      data: {
        gamesSynced: result.counts.games,
        recentSynced: result.counts.recentGames,
        friendsSynced: result.counts.friends,
        achievementsSynced: result.counts.achievements,
        privateSections: result.privateSections,
        gameplayGraphRefreshed: Boolean(graphRefresh.graph),
        warnings: [...(result.warnings || []), ...(graphRefresh.warnings || [])]
      }
    });
  } catch (error) {
    sendSteamError(res, error);
  }
});

export const getSteamLibrary = asyncHandler(async (req, res) => {
  const games = await getSteamLibraryForUser(req.user);
  res.json({
    success: true,
    message: games.length ? "Steam library loaded" : "Steam library is private or unavailable.",
    data: games
  });
});

export const getSteamRecent = asyncHandler(async (req, res) => {
  const games = await getSteamRecentForUser(req.user);
  res.json({
    success: true,
    message: games.length ? "Recently played games loaded" : "Recent Steam activity is private or unavailable.",
    data: games
  });
});

export const getSteamFavorites = asyncHandler(async (req, res) => {
  const favorites = await getFavoriteGamesForUser(req.user);
  res.json({
    success: true,
    message: favorites.length ? "Favorite games detected" : "No favorite games detected yet.",
    data: favorites
  });
});

export const getSteamAchievements = asyncHandler(async (req, res) => {
  const summary = await getAchievementSummaryForUser(req.user);
  res.json({
    success: true,
    message: summary.total ? "Steam achievements loaded" : "Steam achievements are private or unavailable.",
    data: summary
  });
});

export const getSteamFriends = asyncHandler(async (req, res) => {
  const friends = await getSteamFriendsForUser(req.user);
  res.json({
    success: true,
    message: friends.length ? "Steam friends loaded" : "Steam friends are private or unavailable.",
    data: friends
  });
});

export const getSteamHeatmap = asyncHandler(async (req, res) => {
  const heatmap = await getHeatmapForUser(req.user);
  res.json({
    success: true,
    message: "Steam activity heatmap loaded",
    data: heatmap
  });
});

export const getSteamPlayerScore = asyncHandler(async (req, res) => {
  const score = await calculatePlayerScore(req.user);
  res.json({
    success: true,
    message: "Player score loaded",
    data: score
  });
});

export const getSteamMatchInsights = asyncHandler(async (req, res) => {
  const insights = await getMatchInsightsForUser(req.user);
  res.json({
    success: true,
    message: "Match insights loaded",
    data: insights
  });
});

export const getSteamSyncStatus = asyncHandler(async (req, res) => {
  const status = await getSteamSyncStatusForUser(req.user);
  res.json({
    success: true,
    message: "Steam sync status loaded",
    data: status
  });
});
