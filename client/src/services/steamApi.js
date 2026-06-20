import api from "./api";
import { getErrorMessage } from "./api";

const clean = async (request) => {
  try {
    return await request;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const steamApi = {
  getSteamMe: () => clean(api.get("/steam/me")),
  syncSteam: () => clean(api.post("/steam/sync")),
  getSteamLibrary: () => clean(api.get("/steam/library")),
  getSteamRecent: () => clean(api.get("/steam/recent")),
  getSteamFavorites: () => clean(api.get("/steam/favorites")),
  getSteamAchievements: () => clean(api.get("/steam/achievements")),
  getSteamFriends: () => clean(api.get("/steam/friends")),
  getSteamHeatmap: () => clean(api.get("/steam/heatmap")),
  getSteamPlayerScore: () => clean(api.get("/steam/player-score")),
  getSteamMatchInsights: () => clean(api.get("/steam/match-insights"))
};

export default steamApi;
