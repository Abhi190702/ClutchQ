const knownSlugs = {
  "cs2": "counter-strike-2",
  "counter-strike 2": "counter-strike-2",
  "call of duty": "call-of-duty-warzone",
  "ea fc": "ea-fc",
  "f1": "f1",
  "gta v": "gta-online",
  "gta online": "gta-online"
};

const remoteArt = {
  "counter-strike-2": "https://cdn.cloudflare.steamstatic.com/steam/apps/730/library_600x900_2x.jpg",
  "apex-legends": "https://cdn.cloudflare.steamstatic.com/steam/apps/1172470/library_600x900_2x.jpg",
  "the-finals": "https://cdn.cloudflare.steamstatic.com/steam/apps/2073850/library_600x900_2x.jpg",
  "lethal-company": "https://cdn.cloudflare.steamstatic.com/steam/apps/1966720/library_600x900_2x.jpg",
  "phasmophobia": "https://cdn.cloudflare.steamstatic.com/steam/apps/739630/library_600x900_2x.jpg",
  "helldivers-2": "https://cdn.cloudflare.steamstatic.com/steam/apps/553850/library_600x900_2x.jpg",
  "dota-2": "https://cdn.cloudflare.steamstatic.com/steam/apps/570/library_600x900_2x.jpg"
};

export const slugifyGame = (value = "") => {
  const key = String(value).trim().toLowerCase();
  return knownSlugs[key] || key.replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
};

export const getGameArt = (gameName) => {
  const slug = slugifyGame(gameName);
  if (!slug) return "";
  return remoteArt[slug] || `/game-art/${slug}.png`;
};

export const gameInitials = (gameName = "Game") =>
  String(gameName)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "GG";
