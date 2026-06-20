const cleanUrl = (value) => value?.trim()?.replace(/\/$/, "");
const localHostnames = new Set(["localhost", "127.0.0.1", "::1"]);
const isLocalBrowser =
  typeof window !== "undefined" && localHostnames.has(window.location.hostname);

const configuredApiUrl = cleanUrl(import.meta.env.VITE_API_URL);
const localApiUrl = cleanUrl(import.meta.env.VITE_LOCAL_API_URL) || "http://localhost:5000/api";
const productionApiUrl =
  cleanUrl(import.meta.env.VITE_PRODUCTION_API_URL) ||
  configuredApiUrl ||
  "https://clutchq-backend.onrender.com/api";

export const API_URL =
  isLocalBrowser && import.meta.env.VITE_USE_CONFIGURED_API_ON_LOCAL !== "true"
    ? localApiUrl
    : configuredApiUrl || productionApiUrl;

export const GAMES = [
  "Valorant",
  "CS2",
  "BGMI",
  "Apex Legends",
  "Fortnite",
  "Call of Duty",
  "Dota 2",
  "League of Legends",
  "Rocket League",
  "Minecraft"
];

export const REGIONS = ["India", "SEA", "EU", "NA", "Middle East"];
export const LANGUAGES = ["English", "Hindi", "Tamil", "Telugu", "Bengali", "Marathi", "Spanish", "French", "German", "Arabic"];
export const ROLES = ["Duelist", "Controller", "Initiator", "Sentinel", "Flex", "Support", "IGL", "Sniper", "Entry", "Anchor"];
export const LOOKING_FOR = ["Rank Push", "Competitive", "Mic Only", "Chill Stack", "Scrim", "Tournament", "Late Night", "No Toxicity"];
export const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const HOURS = Array.from({ length: 24 }, (_, hour) => hour);

export const DEFAULT_PLAYSTYLE = {
  aggression: 65,
  support: 65,
  communication: 75,
  consistency: 75,
  adaptability: 70
};

export const RANKS = [
  "Iron 1",
  "Iron 2",
  "Iron 3",
  "Bronze 1",
  "Bronze 2",
  "Bronze 3",
  "Silver 1",
  "Silver 2",
  "Silver 3",
  "Gold 1",
  "Gold 2",
  "Gold 3",
  "Platinum 1",
  "Platinum 2",
  "Platinum 3",
  "Diamond 1",
  "Diamond 2",
  "Diamond 3",
  "Ascendant 1",
  "Ascendant 2",
  "Ascendant 3",
  "Immortal 1",
  "Immortal 2",
  "Immortal 3",
  "Radiant"
];
