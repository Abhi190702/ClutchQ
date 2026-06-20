import api from "./api";

export const gameApi = {
  list: (params = {}) => api.get("/games", { params }),
  get: (slug) => api.get(`/games/${slug}`),
  rooms: (slug) => api.get(`/games/${slug}/rooms`),
  stats: (slug) => api.get(`/games/${slug}/stats`),
  topPlayers: (slug) => api.get(`/games/${slug}/top-players`),
  findSquad: (slug) => api.get(`/games/${slug}/find-squad`),
  createRoom: (payload) => api.post("/game-rooms", payload),
  getRoom: (id) => api.get(`/game-rooms/${id}`),
  joinRoom: (id, payload = {}) => api.post(`/game-rooms/${id}/join`, payload),
  leaveRoom: (id) => api.post(`/game-rooms/${id}/leave`),
  readyRoom: (id, ready) => api.post(`/game-rooms/${id}/ready`, { ready }),
  updateRoom: (id, payload) => api.patch(`/game-rooms/${id}`, payload),
  deleteRoom: (id) => api.delete(`/game-rooms/${id}`),
  createDiscord: (id) => api.post(`/game-rooms/${id}/discord/create`),
  getDiscord: (id) => api.get(`/game-rooms/${id}/discord`)
};

export default gameApi;
