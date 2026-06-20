import express from "express";
import {
  deleteProfileAvatar,
  getCurrentProfile,
  getProfilePlayerScore,
  getProfileById,
  getProfileByUserId,
  getProfileSummary,
  listProfiles,
  uploadProfileAvatar,
  upsertCurrentProfile
} from "../controllers/profileController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);
router.get("/", listProfiles);
router.get("/me", getCurrentProfile);
router.put("/me", upsertCurrentProfile);
router.patch("/me", upsertCurrentProfile);
router.post("/avatar", uploadProfileAvatar);
router.delete("/avatar", deleteProfileAvatar);
router.get("/summary", getProfileSummary);
router.get("/player-score", getProfilePlayerScore);
router.get("/user/:userId", getProfileByUserId);
router.get("/:id", getProfileById);

export default router;
