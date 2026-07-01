import ExternalGameMetadata from "../../models/ExternalGameMetadata.js";
import Game from "../../models/Game.js";
import { gameCatalog, getGameBySlug } from "../../data/gameCatalog.js";
import { searchFreeToGame } from "./freeToGameService.js";
import { searchRawg } from "./rawgService.js";

const slugify = (value = "") =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const toPublicMetadata = (doc) => {
  if (!doc) return null;
  const data = doc.toObject ? doc.toObject() : doc;
  return {
    gameSlug: data.gameSlug,
    title: data.title,
    source: data.source,
    coverUrl: data.coverUrl,
    bannerUrl: data.bannerUrl,
    screenshots: data.screenshots || [],
    genres: data.genres || [],
    platforms: data.platforms || [],
    releaseDate: data.releaseDate,
    developer: data.developer,
    publisher: data.publisher,
    lastSyncedAt: data.lastSyncedAt
  };
};

const catalogFallback = async (slug) => {
  const dbGame = await Game.findOne({ slug }).lean();
  const catalogGame = dbGame || getGameBySlug(slug);
  if (!catalogGame) return null;

  return {
    gameSlug: catalogGame.slug,
    title: catalogGame.title,
    source: "catalog",
    coverUrl: catalogGame.posterUrl,
    bannerUrl: catalogGame.coverUrl || catalogGame.posterUrl,
    screenshots: [catalogGame.coverUrl, catalogGame.posterUrl].filter(Boolean),
    genres: catalogGame.genres || [],
    platforms: catalogGame.platforms || [],
    releaseDate: undefined,
    developer: "",
    publisher: "",
    raw: {
      source: "catalog",
      category: catalogGame.category,
      status: catalogGame.status
    }
  };
};

const upsertMetadata = async (gameSlug, metadata) => {
  if (!metadata?.title) return null;
  const payload = {
    ...metadata,
    gameSlug,
    lastSyncedAt: new Date()
  };

  const doc = await ExternalGameMetadata.findOneAndUpdate(
    { gameSlug },
    { $set: payload },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  return toPublicMetadata(doc);
};

const fetchExternalMetadata = async (query) => {
  const [rawgResult, freeToGameResult] = await Promise.allSettled([
    searchRawg(query, { limit: 3 }),
    searchFreeToGame(query, { limit: 3 })
  ]);

  const rawg = rawgResult.status === "fulfilled" ? rawgResult.value : [];
  const free = freeToGameResult.status === "fulfilled" ? freeToGameResult.value : [];
  return [...rawg, ...free].filter((item) => item?.title);
};

export const getCachedGameMetadata = async (slug) => {
  const gameSlug = slugify(slug);
  const cached = await ExternalGameMetadata.findOne({ gameSlug }).lean();
  if (cached) return toPublicMetadata(cached);
  const fallback = await catalogFallback(gameSlug);
  return fallback ? toPublicMetadata(fallback) : null;
};

export const getGameMetadata = async (slug, { refresh = false } = {}) => {
  const gameSlug = slugify(slug);
  if (!refresh) {
    const cached = await ExternalGameMetadata.findOne({ gameSlug }).lean();
    if (cached) return toPublicMetadata(cached);
  }

  const fallback = await catalogFallback(gameSlug);
  if (!refresh) return fallback ? toPublicMetadata(fallback) : null;

  const query = fallback?.title || gameSlug.replace(/-/g, " ");
  const external = await fetchExternalMetadata(query).catch(() => []);
  const best = external[0] || fallback;
  return best ? upsertMetadata(gameSlug, best) : null;
};

export const searchGameMetadata = async (query) => {
  const search = String(query || "").trim();
  if (!search) return [];

  const cached = await ExternalGameMetadata.find({
    $or: [
      { title: new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") },
      { gameSlug: new RegExp(slugify(search), "i") }
    ]
  })
    .sort({ lastSyncedAt: -1 })
    .limit(10)
    .lean();

  if (cached.length) return cached.map(toPublicMetadata);

  const external = await fetchExternalMetadata(search).catch(() => []);
  const saved = [];
  for (const metadata of external.slice(0, 8)) {
    const gameSlug = slugify(metadata.title);
    const doc = await upsertMetadata(gameSlug, metadata);
    if (doc) saved.push(doc);
  }
  return saved;
};

export const syncExternalGameMetadata = async ({ slugs = [] } = {}) => {
  const explicitSlugs = slugs.map(slugify).filter(Boolean).slice(0, 50);
  const dbGames = await Game.find({ active: true }).select("slug").lean();
  const catalogSlugs = gameCatalog.map((game) => game.slug);
  const targets = explicitSlugs.length ? explicitSlugs : [...new Set([...dbGames.map((game) => game.slug), ...catalogSlugs])];
  const errors = [];
  let synced = 0;

  for (const gameSlug of targets) {
    try {
      const metadata = await getGameMetadata(gameSlug, { refresh: true });
      if (metadata) synced += 1;
    } catch (error) {
      errors.push({ gameSlug, message: error.message });
    }
  }

  return {
    requested: targets.length,
    synced,
    errors
  };
};

export const applyMetadataToGames = async (games = []) => {
  const slugs = games.map((game) => game.slug).filter(Boolean);
  if (!slugs.length) return games;
  const metadata = await ExternalGameMetadata.find({ gameSlug: { $in: slugs } }).lean();
  const bySlug = new Map(metadata.map((item) => [item.gameSlug, item]));

  return games.map((game) => {
    const meta = bySlug.get(game.slug);
    if (!meta) return game;
    return {
      ...game,
      posterUrl: meta.coverUrl || game.posterUrl,
      coverUrl: meta.bannerUrl || game.coverUrl,
      externalMetadata: toPublicMetadata(meta)
    };
  });
};
