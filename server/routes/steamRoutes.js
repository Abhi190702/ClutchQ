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
  syncSteam
} from "../controllers/steamController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);
router.get("/me", getSteamMe);
router.post("/sync", syncSteam);
router.get("/library", getSteamLibrary);
router.get("/recent", getSteamRecent);
router.get("/favorites", getSteamFavorites);
router.get("/achievements", getSteamAchievements);
router.get("/friends", getSteamFriends);
router.get("/heatmap", getSteamHeatmap);
router.get("/player-score", getSteamPlayerScore);
router.get("/match-insights", getSteamMatchInsights);

export default router;
