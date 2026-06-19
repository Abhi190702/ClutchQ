import express from "express";
import {
  compareProfiles,
  explainMatch,
  findSquadNow,
  getRecommendations
} from "../controllers/matchmakingController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);
router.get("/recommendations", getRecommendations);
router.get("/explain/:profileId", explainMatch);
router.get("/compare/:profileId", compareProfiles);
router.post("/find-squad-now", findSquadNow);

export default router;
