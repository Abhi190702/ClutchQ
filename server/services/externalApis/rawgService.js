import { fetchJson } from "./httpClient.js";

const rawgBaseUrl = "https://api.rawg.io/api/games";

const normalizeRawg = (game) => ({
  title: game.name,
  source: "rawg",
  coverUrl: game.background_image,
  bannerUrl: game.background_image,
  screenshots: (game.short_screenshots || []).map((shot) => shot.image).filter(Boolean),
  genres: (game.genres || []).map((genre) => genre.name).filter(Boolean),
  platforms: (game.platforms || []).map((item) => item.platform?.name).filter(Boolean),
  releaseDate: game.released ? new Date(game.released) : undefined,
  developer: "",
  publisher: "",
  raw: game
});

export const searchRawg = async (query, { limit = 8 } = {}) => {
  const apiKey = String(process.env.RAWG_API_KEY || "").trim();
  const search = String(query || "").trim();
  if (!apiKey || !search) return [];

  const params = new URLSearchParams({
    key: apiKey,
    search,
    page_size: String(limit)
  });
  const result = await fetchJson(`${rawgBaseUrl}?${params.toString()}`);
  return (result.results || []).map(normalizeRawg);
};
