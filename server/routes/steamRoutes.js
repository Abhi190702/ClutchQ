import express from "express";
import {
  getSteamAchievements,
  getSteamFavorites,
  getSteamFriends,
  getSteamHeatmap,
  getSteamLibrary,
  getSteamMatchInsights,
  getSteamMe,
  getSteamPlayerScore,
  getSteamRecent,
  getSteamSyncStatus,
  syncSteam
} from "../controllers/steamController.js";
import { protect } from "../middleware/authMiddleware.js";
import { steamSyncLimiter } from "../middleware/rateLimiters.js";

const router = express.Router();

router.use(protect);
router.get("/me", getSteamMe);
router.post("/sync", steamSyncLimiter, syncSteam);
router.get("/sync-status", getSteamSyncStatus);
router.get("/library", getSteamLibrary);
router.get("/recent", getSteamRecent);
router.get("/favorites", getSteamFavorites);
router.get("/achievements", getSteamAchievements);
router.get("/friends", getSteamFriends);
router.get("/heatmap", getSteamHeatmap);
router.get("/player-score", getSteamPlayerScore);
router.get("/match-insights", getSteamMatchInsights);

export default router;
