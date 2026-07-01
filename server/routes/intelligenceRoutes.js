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
import { scorecardUploadLimiter } from "../middleware/rateLimiters.js";

const router = express.Router();

router.get("/health", getIntelligenceHealth);

router.use(protect);

router.post("/scorecards", scorecardUploadLimiter, uploadScorecard);
router.get("/scorecards/me", getMyScorecards);
router.post("/sessions/:sessionId/feedback", submitSessionFeedback);
router.post("/graph/rebuild", rebuildMyGraph);
router.get("/graph/me", getMyGraph);
router.get("/rhythm/me", getMyRhythm);
router.get("/teammates/me", getMyTeammates);

export default router;
