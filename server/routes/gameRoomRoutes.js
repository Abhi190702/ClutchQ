import express from "express";
import {
  createGameRoom,
  createGameRoomDiscord,
  deleteGameRoomDiscord,
  deleteGameRoom,
  getGameRoom,
  getGameRoomDiscord,
  joinGameRoom,
  leaveGameRoom,
  updateGameRoom,
  updateGameRoomReady
} from "../controllers/gameRoomController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);
router.post("/", createGameRoom);
router.get("/:id", getGameRoom);
router.post("/:id/join", joinGameRoom);
router.post("/:id/leave", leaveGameRoom);
router.post("/:id/ready", updateGameRoomReady);
router.patch("/:id", updateGameRoom);
router.delete("/:id", deleteGameRoom);
router.post("/:id/discord/create", createGameRoomDiscord);
router.get("/:id/discord", getGameRoomDiscord);
router.delete("/:id/discord", deleteGameRoomDiscord);

export default router;
