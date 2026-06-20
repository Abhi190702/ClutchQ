import express from "express";
import {
  demoLogin,
  getMe,
  handleDiscordOAuth,
  handleGoogleOAuth,
  login,
  logout,
  providerNotConfigured,
  register,
  startDiscordOAuth,
  startGoogleOAuth
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/demo", demoLogin);
router.post("/logout", logout);
router.get("/me", protect, getMe);

router.get("/google", startGoogleOAuth);
router.get("/google/callback", handleGoogleOAuth);
router.get("/discord", startDiscordOAuth);
router.get("/discord/callback", handleDiscordOAuth);

router.get("/steam", providerNotConfigured("Steam"));
router.get("/steam/callback", providerNotConfigured("Steam"));
router.get("/epic", providerNotConfigured("Epic Games"));
router.get("/epic/callback", providerNotConfigured("Epic Games"));
router.get("/microsoft", providerNotConfigured("Microsoft"));
router.get("/microsoft/callback", providerNotConfigured("Microsoft"));

export default router;
