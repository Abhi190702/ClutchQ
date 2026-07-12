import express from "express";
import {
  getIntelligenceHealth,
  getMyGraph,
  getMyRhythm,
  getMyScorecards,
  getMyTeammates,
  rebuildMyGraph,
  submitSessionFeedback,
  uploadScorecard
} from "../controllers/intelligenceController.js";
import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";
import { analyticsRebuildLimiter, scorecardUploadLimiter } from "../middleware/rateLimiters.js";

const router = express.Router();

router.use(protect);

router.get("/health", adminOnly, getIntelligenceHealth);
router.post("/scorecards", scorecardUploadLimiter, uploadScorecard);
router.get("/scorecards/me", getMyScorecards);
router.post("/sessions/:sessionId/feedback", analyticsRebuildLimiter, submitSessionFeedback);
router.post("/graph/rebuild", analyticsRebuildLimiter, rebuildMyGraph);
router.get("/graph/me", getMyGraph);
router.get("/rhythm/me", getMyRhythm);
router.get("/teammates/me", getMyTeammates);

export default router;
