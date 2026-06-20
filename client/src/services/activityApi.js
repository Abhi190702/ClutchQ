import api from "./api";

export const activityApi = {
  start: (payload) => api.post("/activity/start", payload),
  stop: (id, payload) => api.post(`/activity/${id}/stop`, payload),
  me: () => api.get("/activity/me"),
  active: () => api.get("/activity/active"),
  game: (slug) => api.get(`/activity/game/${slug}`),
  summary: () => api.get("/activity/summary/me")
};

export default activityApi;
