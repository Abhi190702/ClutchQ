import express from "express";
import { createSessionFromLobby, listSessions } from "../controllers/sessionController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);
router.route("/").get(listSessions).post(createSessionFromLobby);

export default router;
