import express from "express";
import { getDiscordHealth } from "../controllers/discordController.js";
import { adminOnly } from "../middleware/adminMiddleware.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect, adminOnly);
router.get("/health", getDiscordHealth);

export default router;
