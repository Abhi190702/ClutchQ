import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const titleByPath = {
  "/": "ClutchQ",
  "/login": "Sign in",
  "/register": "Create account",
  "/oauth/success": "Connecting account",
  "/onboarding": "Build profile",
  "/dashboard": "Dashboard",
  "/games": "Games",
  "/activity": "Activity",
  "/leaderboards": "Leaderboards",
  "/profile": "Profile",
  "/lobbies": "Lobbies",
  "/lobbies/create": "Create lobby",
  "/requests": "Requests",
  "/reviews": "Reviews",
  "/admin/dashboard": "Admin dashboard",
  "/admin/reports": "Admin reports"
};

const getRouteTitle = (pathname) => {
  if (titleByPath[pathname]) return titleByPath[pathname];
  if (pathname.startsWith("/games/") && pathname.endsWith("/rooms")) return "Game rooms";
  if (pathname.startsWith("/games/")) return "Game details";
  if (pathname.startsWith("/lobbies/")) return "Lobby details";
  if (pathname.startsWith("/squad/")) return "Squad room";
  if (pathname.startsWith("/player/")) return "Player profile";
  return "Page not found";
};

const usePageTitle = () => {
  const location = useLocation();

  useEffect(() => {
    document.title = `${getRouteTitle(location.pathname)} | ClutchQ`;
  }, [location.pathname]);
};

export default usePageTitle;
