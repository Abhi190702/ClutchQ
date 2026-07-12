import express from "express";
import {
  demoLogin,
  createOAuthLinkCode,
  exchangeOAuthCode,
  forgotPassword,
  getSecurityHealth,
  getMe,
  handleDiscordOAuth,
  handleGoogleOAuth,
  handleSteamOAuth,
  login,
  logout,
  providerNotConfigured,
  register,
  requestOtp,
  resetPassword,
  startDiscordOAuth,
  startGoogleOAuth,
  startSteamOAuth,
  verifyEmailOtp,
  verifyPasswordResetOtp
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";
import {
  authLimiter,
  loginLimiter,
  otpRequestLimiter,
  otpVerifyLimiter,
  passwordResetLimiter,
  registrationLimiter
} from "../middleware/rateLimiters.js";

const router = express.Router();

router.post("/register", registrationLimiter, register);
router.post("/login", loginLimiter, login);
router.post("/demo", loginLimiter, demoLogin);
router.post("/logout", logout);
router.post("/oauth/exchange", loginLimiter, exchangeOAuthCode);
router.post("/oauth/link-code", authLimiter, protect, createOAuthLinkCode);
router.get("/me", protect, getMe);
router.post("/otp/request", otpRequestLimiter, requestOtp);
router.post("/otp/verify", otpVerifyLimiter, verifyEmailOtp);
router.get("/security/health", authLimiter, protect, adminOnly, getSecurityHealth);
router.post("/password/forgot", passwordResetLimiter, forgotPassword);
router.post("/password/verify-otp", otpVerifyLimiter, verifyPasswordResetOtp);
router.post("/password/reset", passwordResetLimiter, resetPassword);

router.get("/google", authLimiter, startGoogleOAuth);
router.get("/google/callback", handleGoogleOAuth);
router.get("/discord", authLimiter, startDiscordOAuth);
router.get("/discord/callback", handleDiscordOAuth);

router.get("/steam", authLimiter, startSteamOAuth);
router.get("/steam/callback", handleSteamOAuth);
router.get("/epic", providerNotConfigured("Epic Games"));
router.get("/epic/callback", providerNotConfigured("Epic Games"));
router.get("/microsoft", providerNotConfigured("Microsoft"));
router.get("/microsoft/callback", providerNotConfigured("Microsoft"));

export default router;
