import express from "express";
import {
  getCurrentProfile,
  getProfileById,
  getProfileByUserId,
  listProfiles,
  upsertCurrentProfile
} from "../controllers/profileController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);
router.get("/", listProfiles);
router.get("/me", getCurrentProfile);
router.put("/me", upsertCurrentProfile);
router.get("/user/:userId", getProfileByUserId);
router.get("/:id", getProfileById);

export default router;
