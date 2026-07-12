import { asyncHandler } from "../middleware/errorMiddleware.js";
import {
  getGameMetadata,
  searchGameMetadata,
  syncExternalGameMetadata
} from "../services/externalApis/gameMetadataService.js";
import { boundedQueryText } from "../utils/queryInput.js";

export const searchExternalGames = asyncHandler(async (req, res) => {
  const query = boundedQueryText(req.query.q, 100);
  if (query.length < 2) {
    return res.json({
      success: true,
      message: "Use at least 2 characters to search game metadata.",
      data: []
    });
  }

  const data = await searchGameMetadata(query);
  res.json({
    success: true,
    message: data.length ? "External game metadata loaded" : "No cached external metadata found",
    data
  });
});

export const getExternalGameMetadata = asyncHandler(async (req, res) => {
  const data = await getGameMetadata(String(req.params.slug || "").slice(0, 100), { refresh: false });
  if (!data) {
    res.status(404);
    throw new Error("Game metadata not found");
  }

  res.json({
    success: true,
    message: "Game metadata loaded",
    data
  });
});

export const syncExternalGames = asyncHandler(async (req, res) => {
  const slugs = Array.isArray(req.body?.slugs) ? req.body.slugs : [];
  const data = await syncExternalGameMetadata({ slugs });

  res.json({
    success: true,
    message: "External game metadata sync finished",
    data
  });
});
