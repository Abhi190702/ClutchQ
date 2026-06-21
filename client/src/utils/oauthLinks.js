import { getOAuthUrl } from "./constants";

export const startProviderOAuth = (providerId, nextPath = window.location.pathname || "/dashboard") => {
  const token = localStorage.getItem("clutchq_token");
  const params = new URLSearchParams({
    returnTo: window.location.origin,
    next: nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/dashboard"
  });

  if (token && providerId === "steam") params.set("token", token);

  window.location.href = getOAuthUrl(providerId, Object.fromEntries(params));
};
