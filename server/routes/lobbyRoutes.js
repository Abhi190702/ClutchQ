import express from "express";
import { closeLobby, createLobby, getLobby, listLobbies, updateReadyCheck } from "../controllers/lobbyController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);
router.route("/").get(listLobbies).post(createLobby);
router.get("/:id", getLobby);
router.patch("/:id/close", closeLobby);
router.patch("/:id/ready", updateReadyCheck);

export default router;
