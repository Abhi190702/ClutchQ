import express from "express";
import { getActiveActivity, getGameActivity, getMyActivity, getMyActivitySummary, startActivity, stopActivity } from "../controllers/activityController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);
router.post("/start", startActivity);
router.post("/:id/stop", stopActivity);
router.get("/me", getMyActivity);
router.get("/active", getActiveActivity);
router.get("/game/:slug", getGameActivity);
router.get("/summary/me", getMyActivitySummary);

export default router;
