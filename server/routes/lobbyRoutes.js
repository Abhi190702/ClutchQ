import express from "express";
import { createLobbyDiscordRoom, deleteLobbyDiscordRoom, getLobbyDiscordRoom } from "../controllers/discordLobbyController.js";
import { closeLobby, createLobby, getLobby, listLobbies, updateReadyCheck } from "../controllers/lobbyController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);
router.route("/").get(listLobbies).post(createLobby);
router.post("/:id/discord/create", createLobbyDiscordRoom);
router.get("/:id/discord", getLobbyDiscordRoom);
router.delete("/:id/discord", deleteLobbyDiscordRoom);
router.get("/:id", getLobby);
router.patch("/:id/close", closeLobby);
router.patch("/:id/ready", updateReadyCheck);

export default router;
