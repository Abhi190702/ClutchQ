import { fetchJson, normalizeList } from "./httpClient.js";

const baseUrl = "https://www.freetogame.com/api/games";

const normalizeFreeToGame = (game) => ({
  title: game.title,
  source: "freetogame",
  coverUrl: game.thumbnail,
  bannerUrl: game.thumbnail,
  screenshots: game.thumbnail ? [game.thumbnail] : [],
  genres: normalizeList(game.genre),
  platforms: normalizeList(game.platform),
  releaseDate: game.release_date ? new Date(game.release_date) : undefined,
  developer: game.developer,
  publisher: game.publisher,
  raw: game
});

export const searchFreeToGame = async (query, { limit = 8 } = {}) => {
  const search = String(query || "").trim().toLowerCase();
  if (!search) return [];

  const games = await fetchJson(baseUrl);
  return games
    .filter((game) => String(game.title || "").toLowerCase().includes(search))
    .slice(0, limit)
    .map(normalizeFreeToGame);
};
