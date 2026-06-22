import api from "./api";

export const intelligenceApi = {
  getHealth: () => api.get("/intelligence/health"),
  uploadScorecard: (payload) => api.post("/intelligence/scorecards", payload),
  getMyScorecards: () => api.get("/intelligence/scorecards/me"),
  submitSessionFeedback: (sessionId, payload) => api.post(`/intelligence/sessions/${sessionId}/feedback`, payload),
  rebuildGraph: () => api.post("/intelligence/graph/rebuild"),
  getMyGraph: () => api.get("/intelligence/graph/me"),
  getMyRhythm: () => api.get("/intelligence/rhythm/me"),
  getMyTeammates: () => api.get("/intelligence/teammates/me")
};

export default intelligenceApi;
