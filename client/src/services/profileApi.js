import api from "./api";
import { getErrorMessage } from "./api";

const clean = async (request) => {
  try {
    return await request;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const profileApi = {
  getProfile: () => clean(api.get("/profile/me")),
  updateProfile: (data) => clean(api.patch("/profile/me", data)),
  uploadAvatar: (dataUrl) => clean(api.post("/profile/avatar", { dataUrl })),
  deleteAvatar: () => clean(api.delete("/profile/avatar")),
  getSummary: () => clean(api.get("/profile/summary")),
  getPlayerScore: () => clean(api.get("/profile/player-score"))
};

export default profileApi;
