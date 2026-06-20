import express from "express";
import { findSquadNow, getGame, getGameRooms, getGameStats, getTopPlayers, listGames } from "../controllers/gameController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", listGames);
router.get("/:slug", getGame);
router.get("/:slug/rooms", getGameRooms);
router.get("/:slug/stats", protect, getGameStats);
router.get("/:slug/top-players", getTopPlayers);
router.get("/:slug/find-squad", protect, findSquadNow);

export default router;
