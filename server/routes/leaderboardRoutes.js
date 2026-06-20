import express from "express";
import { getGameLeaderboards, getPlayerLeaderboards, getTrendingGames } from "../controllers/leaderboardController.js";

const router = express.Router();

router.get("/games", getGameLeaderboards);
router.get("/players", getPlayerLeaderboards);
router.get("/trending-games", getTrendingGames);

export default router;
