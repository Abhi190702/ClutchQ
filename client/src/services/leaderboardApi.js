import api from "./api";

export const leaderboardApi = {
  games: (params = {}) => api.get("/leaderboards/games", { params }),
  players: (params = {}) => api.get("/leaderboards/players", { params }),
  trendingGames: () => api.get("/leaderboards/trending-games")
};

export default leaderboardApi;
