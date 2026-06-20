import { API_URL } from "./constants";

export const getApiOrigin = () => {
  try {
    return new URL(API_URL).origin;
  } catch {
    return "http://localhost:5000";
  }
};

export const startProviderOAuth = (providerId, nextPath = window.location.pathname || "/dashboard") => {
  const token = localStorage.getItem("clutchq_token");
  const params = new URLSearchParams({
    returnTo: window.location.origin,
    next: nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/dashboard"
  });

  if (token && providerId === "steam") params.set("token", token);

  window.location.href = `${getApiOrigin()}/api/auth/${providerId}?${params.toString()}`;
};
