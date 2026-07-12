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

const cleanText = (value, maxLength = 160) => String(value || "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength);
const safeUrl = (value) => {
  if (!value || String(value).length > 2048) return "";
  try {
    const url = new URL(String(value));
    return ["http:", "https:"].includes(url.protocol) ? url.toString() : "";
  } catch {
    return "";
  }
};
const cleanList = (values, maxItems = 20, maxLength = 80) =>
  Array.isArray(values) ? [...new Set(values.map((value) => cleanText(value, maxLength)).filter(Boolean))].slice(0, maxItems) : [];
const cleanMetadata = (metadata = {}) => {
  const source = ["catalog", "freetogame", "rawg", "manual"].includes(metadata.source) ? metadata.source : "catalog";
  const releaseDate = metadata.releaseDate ? new Date(metadata.releaseDate) : undefined;
  return {
    title: cleanText(metadata.title, 160),
    source,
    coverUrl: safeUrl(metadata.coverUrl),
    bannerUrl: safeUrl(metadata.bannerUrl),
    screenshots: cleanList((metadata.screenshots || []).map(safeUrl), 12, 2048),
    genres: cleanList(metadata.genres, 20, 60),
    platforms: cleanList(metadata.platforms, 20, 60),
    releaseDate: releaseDate && !Number.isNaN(releaseDate.getTime()) ? releaseDate : undefined,
    developer: cleanText(metadata.developer, 160),
    publisher: cleanText(metadata.publisher, 160)
  };
};

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

const toTransientPublicMetadata = (metadata) => {
  const cleaned = cleanMetadata(metadata);
  const gameSlug = slugify(cleaned.title);
  if (!cleaned.title || !gameSlug) return null;
  return toPublicMetadata({
    ...cleaned,
    gameSlug,
    lastSyncedAt: null
  });
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
    raw: undefined
  };
};

const upsertMetadata = async (gameSlug, metadata) => {
  const cleaned = cleanMetadata(metadata);
  if (!cleaned.title) return null;
  const payload = {
    ...cleaned,
    gameSlug,
    lastSyncedAt: new Date()
  };

  const doc = await ExternalGameMetadata.findOneAndUpdate(
    { gameSlug },
    { $set: payload, $unset: { raw: "" } },
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
  const searchSlug = slugify(search);
  const escapedTitle = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const searchConditions = [{ title: new RegExp(escapedTitle, "i") }];
  if (searchSlug) searchConditions.push({ gameSlug: new RegExp(searchSlug, "i") });

  const cached = await ExternalGameMetadata.find({
    $or: searchConditions
  })
    .sort({ lastSyncedAt: -1 })
    .limit(10)
    .lean();

  if (cached.length) return cached.map(toPublicMetadata);

  const external = await fetchExternalMetadata(search).catch(() => []);
  const transient = external.slice(0, 8).map(toTransientPublicMetadata).filter(Boolean);
  return [...new Map(transient.map((item) => [item.gameSlug, item])).values()];
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
