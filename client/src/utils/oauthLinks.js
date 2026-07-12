import { getOAuthUrl } from "./constants";
import api, { getErrorMessage } from "../services/api";

export const startProviderOAuth = async (providerId, nextPath = window.location.pathname || "/dashboard") => {
  const params = new URLSearchParams({
    returnTo: window.location.origin,
    next: nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/dashboard"
  });

  try {
    if (localStorage.getItem("clutchq_token")) {
      const response = await api.post("/auth/oauth/link-code", { provider: providerId });
      params.set("linkCode", response.data.data.code);
    }
    window.location.assign(getOAuthUrl(providerId, Object.fromEntries(params)));
    return true;
  } catch (error) {
    window.dispatchEvent(
      new CustomEvent("clutchq:toast", {
        detail: {
          message: getErrorMessage(error) || "Account connection could not be started.",
          type: "error"
        }
      })
    );
    return false;
  }
};
