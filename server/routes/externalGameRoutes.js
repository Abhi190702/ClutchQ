import express from "express";
import {
  getExternalGameMetadata,
  searchExternalGames,
  syncExternalGames
} from "../controllers/externalGameController.js";
import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";
import { externalMetadataLimiter } from "../middleware/rateLimiters.js";

const router = express.Router();

router.get("/games/search", externalMetadataLimiter, searchExternalGames);
router.get("/games/:slug/metadata", externalMetadataLimiter, getExternalGameMetadata);
router.post("/games/sync", protect, adminOnly, syncExternalGames);

export default router;
