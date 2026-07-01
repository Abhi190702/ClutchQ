import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import GamerProfile from "../models/GamerProfile.js";
import generateToken from "../utils/generateToken.js";
import { asyncHandler } from "../middleware/errorMiddleware.js";
import { createDemoProfile } from "../utils/seedData.js";
import { buildDiscordAuthUrl, handleDiscordOAuthCallback, isDiscordOAuthConfigured } from "../services/oauth/discordOAuthService.js";
import { buildGoogleAuthUrl, handleGoogleOAuthCallback, isGoogleOAuthConfigured } from "../services/oauth/googleOAuthService.js";
import { sendOtpEmail } from "../services/emailService.js";
import { createOtp, invalidateOtps, verifyOtp } from "../services/otpService.js";
import {
  consumePasswordResetSession,
  createPasswordResetSession,
  verifyPasswordResetSession
} from "../services/passwordResetSessionService.js";
import { buildSteamAuthUrl, getPlayerSummary, verifySteamOpenId } from "../services/steamService.js";
import { verifyTurnstileToken } from "../services/turnstileService.js";
import { getJwtSecret } from "../utils/validateEnv.js";

const isLocalDev = process.env.npm_lifecycle_event === "dev" || process.env.NODE_ENV === "development";
const useSecureCookies = process.env.NODE_ENV === "production" && !isLocalDev;

const cookieOptions = {
  httpOnly: true,
  maxAge: 30 * 24 * 60 * 60 * 1000,
  sameSite: useSecureCookies ? "none" : "lax",
  secure: useSecureCookies
};

const oauthStateCookieOptions = {
  httpOnly: true,
  maxAge: 10 * 60 * 1000,
  sameSite: "lax",
  secure: useSecureCookies
};

const oauthStateCookieName = (provider) => `clutchq_${provider}_oauth_state`;
const oauthReturnCookieName = (provider) => `clutchq_${provider}_oauth_return_to`;
const oauthNextCookieName = (provider) => `clutchq_${provider}_oauth_next`;
const DEMO_EMAIL = "demo@clutchq.com";
const DEMO_PASSWORD = "demo123";
const DEMO_EMAILS = new Set(["demo@clutchq.com", "captain@clutchq.com", "sentinel@clutchq.com", "flex@clutchq.com"]);
const MAX_FAILED_LOGIN_ATTEMPTS = 10;
const LOGIN_LOCK_MS = 15 * 60 * 1000;
const OTP_PUBLIC_MESSAGE = "If this email can receive a code, an OTP has been sent.";
const PUBLIC_OTP_PURPOSES = new Set(["email_verification", "password_reset"]);
const normalizeEmail = (email) => String(email || "").trim().toLowerCase();
const safeNextPath = (value) => (typeof value === "string" && value.startsWith("/") && !value.startsWith("//") ? value : null);
const isDemoEmail = (email) => DEMO_EMAILS.has(normalizeEmail(email));
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email));
const strongEnoughPassword = (password) => {
  const value = String(password || "");
  const lower = value.toLowerCase();
  const weak = new Set(["password", "password123", "12345678", "qwerty123", "admin123"]);
  return value.length >= 8 && /[a-z]/i.test(value) && /\d/.test(value) && !weak.has(lower);
};
const getRemoteIp = (req) => req.ip || req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket?.remoteAddress || "";
const genericOtpSuccess = (res, extra = {}) =>
  res.json({
    success: true,
    message: OTP_PUBLIC_MESSAGE,
    data: extra
  });

const verifyPublicTurnstile = async (req) => {
  const result = await verifyTurnstileToken(req.body?.turnstileToken, getRemoteIp(req));
  if (!result.success) {
    const error = new Error("Security check failed. Please try again.");
    error.statusCode = 400;
    throw error;
  }
  return result;
};

const createAndSendOtpIfEligible = async ({ req, email, purpose }) => {
  const normalizedEmail = normalizeEmail(email);
  const user = await User.findOne({ email: normalizedEmail });
  const eligible =
    purpose === "email_verification"
      ? Boolean(user && !user.emailVerified)
      : Boolean(user?.passwordHash);

  if (!eligible) {
    return { sent: false };
  }

  const created = await createOtp({
    email: normalizedEmail,
    purpose,
    ip: getRemoteIp(req),
    userAgent: req.get("user-agent")
  });

  if (created.cooldown) {
    return { sent: false, cooldown: true, retryAfterSeconds: created.retryAfterSeconds };
  }

  await sendOtpEmail({ to: normalizedEmail, otp: created.otp, purpose });
  return { sent: true, resendSeconds: created.resendSeconds, ttlMinutes: created.ttlMinutes };
};

const normalizeUrl = (value) => {
  if (!value) return null;
  const trimmed = value.trim().replace(/\/$/, "");

  if (trimmed.startsWith("https:") && !trimmed.startsWith("https://")) {
    return trimmed.replace("https:", "https://");
  }

  if (trimmed.startsWith("http:") && !trimmed.startsWith("http://")) {
    return trimmed.replace("http:", "http://");
  }

  return trimmed;
};

const originFromValue = (value) => {
  try {
    return new URL(normalizeUrl(value)).origin;
  } catch {
    return null;
  }
};

const isLocalOrigin = (origin) => {
  try {
    const url = new URL(origin);
    return ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  } catch {
    return false;
  }
};

const configuredClientOrigin = () =>
  normalizeUrl(isLocalDev ? process.env.LOCAL_CLIENT_URL || "http://localhost:5173" : process.env.CLIENT_URL || "https://clutch-q.vercel.app");

const allowedClientOrigins = () =>
  new Set(
    [
      "http://localhost:5173",
      "http://localhost:5174",
      "https://clutch-q.vercel.app",
      process.env.CLIENT_URL,
      process.env.LOCAL_CLIENT_URL,
      ...(process.env.ALLOWED_CLIENT_ORIGINS || "").split(",")
    ]
      .map((value) => originFromValue(value))
      .filter(Boolean)
  );

const isAllowedClientOrigin = (origin) => Boolean(origin && (isLocalOrigin(origin) || allowedClientOrigins().has(origin)));

const getRequestClientOrigin = (req) => {
  const requested = originFromValue(req.query.returnTo) || originFromValue(req.get("origin")) || originFromValue(req.get("referer"));
  return isAllowedClientOrigin(requested) ? requested : configuredClientOrigin();
};

const getStoredClientOrigin = (req, res, provider) => {
  const cookieName = oauthReturnCookieName(provider);
  const stored = originFromValue(req.cookies?.[cookieName]);
  res.clearCookie(cookieName, oauthStateCookieOptions);
  return isAllowedClientOrigin(stored) ? stored : configuredClientOrigin();
};

const getStoredNextPath = (req, res, provider) => {
  const cookieName = oauthNextCookieName(provider);
  const stored = safeNextPath(req.cookies?.[cookieName]);
  res.clearCookie(cookieName, oauthStateCookieOptions);
  return stored;
};

const getClientRedirect = (path, clientOrigin = configuredClientOrigin()) => `${clientOrigin}${path}`;

const redirectOAuthError = (req, res, provider, error = "oauth_failed") => {
  const clientOrigin = provider ? getStoredClientOrigin(req, res, provider) : getRequestClientOrigin(req);
  if (provider) getStoredNextPath(req, res, provider);
  res.redirect(getClientRedirect(`/login?error=${encodeURIComponent(error)}`, clientOrigin));
};

const createOAuthState = (req, res, provider) => {
  const state = crypto.randomBytes(24).toString("hex");
  res.cookie(oauthStateCookieName(provider), state, oauthStateCookieOptions);
  res.cookie(oauthReturnCookieName(provider), getRequestClientOrigin(req), oauthStateCookieOptions);
  const nextPath = safeNextPath(req.query.next);
  if (nextPath) res.cookie(oauthNextCookieName(provider), nextPath, oauthStateCookieOptions);
  return state;
};

const verifyOAuthState = (req, res, provider) => {
  const cookieName = oauthStateCookieName(provider);
  const expectedState = req.cookies?.[cookieName];
  res.clearCookie(cookieName, oauthStateCookieOptions);
  return Boolean(expectedState && req.query.state && expectedState === req.query.state);
};

const issueToken = (res, user) => {
  const token = generateToken(user._id);
  res.cookie("token", token, cookieOptions);
  return token;
};

const authResponse = async (res, user, message) => {
  const profile = await GamerProfile.findOne({ userId: user._id });
  const token = issueToken(res, user);

  res.json({
    success: true,
    message,
    data: {
      token,
      user: user.toSafeJSON ? user.toSafeJSON() : user,
      profile
    }
  });
};

const findUserForProvider = async (provider, providerId, email) => {
  const providerPath = `authProviders.${provider}.id`;
  const byProvider = await User.findOne({ [providerPath]: providerId });
  if (byProvider) return byProvider;
  if (!email) return null;
  return User.findOne({ email: email.toLowerCase() });
};

const createOrUpdateOAuthUser = async ({ provider, providerData }) => {
  const fallbackEmail = providerData.email || `${provider}-${providerData.id}@${provider}.clutchq.local`;
  const user = await findUserForProvider(provider, providerData.id, fallbackEmail);
  const name = providerData.name || providerData.globalName || providerData.username || fallbackEmail.split("@")[0];

  if (user) {
    user.name = user.name || name;
    user.email = user.email || fallbackEmail;
    user.avatar = providerData.avatar || user.avatar;
    user.emailVerified = true;
    user.emailVerifiedAt = user.emailVerifiedAt || new Date();
    user.authProviders = {
      ...(user.authProviders?.toObject?.() || user.authProviders || {}),
      [provider]: providerData
    };
    await user.save();
    return user;
  }

  return User.create({
    name,
    email: fallbackEmail,
    avatar: providerData.avatar,
    emailVerified: true,
    emailVerifiedAt: new Date(),
    authProviders: {
      [provider]: providerData
    }
  });
};

const redirectOAuthSuccess = (req, res, provider, user, nextPath = null) => {
  const clientOrigin = provider ? getStoredClientOrigin(req, res, provider) : getRequestClientOrigin(req);
  const token = issueToken(res, user);
  const params = new URLSearchParams({ token });
  const safeNext = safeNextPath(nextPath) || (provider ? getStoredNextPath(req, res, provider) : null) || safeNextPath(req.query.next);
  if (safeNext) params.set("next", safeNext);
  res.redirect(getClientRedirect(`/oauth/success?${params.toString()}`, clientOrigin));
};

const getLinkUserFromRequest = async (req) => {
  const token = req.cookies?.token || req.query.linkToken;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, getJwtSecret());
    return User.findById(decoded.id);
  } catch {
    return null;
  }
};

const createOrUpdateSteamUser = async ({ req, steamId, summary }) => {
  const linkUser = await getLinkUserFromRequest(req);
  const steamData = {
    steamId,
    displayName: summary?.personaname || `Steam ${steamId.slice(-6)}`,
    avatar: summary?.avatarfull || summary?.avatarmedium,
    profileUrl: summary?.profileurl || `https://steamcommunity.com/profiles/${steamId}`,
    connectedAt: new Date(),
    lastSyncedAt: new Date()
  };

  if (linkUser) {
    linkUser.authProviders = {
      ...(linkUser.authProviders?.toObject?.() || linkUser.authProviders || {}),
      steam: steamData
    };
    linkUser.avatar = linkUser.avatar || steamData.avatar;
    linkUser.emailVerified = true;
    linkUser.emailVerifiedAt = linkUser.emailVerifiedAt || new Date();
    await linkUser.save();
    return linkUser;
  }

  const existing = await User.findOne({ "authProviders.steam.steamId": steamId });
  if (existing) {
    existing.name = existing.name || steamData.displayName;
    existing.avatar = steamData.avatar || existing.avatar;
    existing.emailVerified = true;
    existing.emailVerifiedAt = existing.emailVerifiedAt || new Date();
    existing.authProviders = {
      ...(existing.authProviders?.toObject?.() || existing.authProviders || {}),
      steam: steamData
    };
    await existing.save();
    return existing;
  }

  const user = await User.create({
    name: steamData.displayName,
    email: `steam-${steamId}@steam.clutchq.local`,
    avatar: steamData.avatar,
    emailVerified: true,
    emailVerifiedAt: new Date(),
    authProviders: { steam: steamData }
  });

  await GamerProfile.findOneAndUpdate(
    { userId: user._id },
    {
      userId: user._id,
      displayName: steamData.displayName,
      clutchTag: `${steamData.displayName.replace(/[^a-z0-9]/gi, "").slice(0, 12) || "Steam"}#${steamId.slice(-4)}`,
      playerCode: `CLQ-STEAM-${steamId.slice(-4)}`,
      profileCompleteness: 25
    },
    { upsert: true, new: true }
  );

  return user;
};

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const normalizedEmail = normalizeEmail(email);

  if (!name || !normalizedEmail || !password) {
    res.status(400);
    throw new Error("Name, email, and password are required");
  }

  if (!strongEnoughPassword(password)) {
    res.status(400);
    throw new Error("Password must be at least 8 characters and include a letter and a number.");
  }

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    res.status(409);
    throw new Error("Unable to create account. Please use different details or sign in.");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    name: String(name).trim(),
    email: normalizedEmail,
    passwordHash,
    emailVerified: false,
    avatar: `https://api.dicebear.com/8.x/identicon/svg?seed=${encodeURIComponent(normalizedEmail)}`
  });

  res.status(201);
  await authResponse(res, user, "Account created successfully");
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || !password) {
    res.status(400);
    throw new Error("Email and password are required");
  }

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  if (user.isSuspended) {
    res.status(403);
    throw new Error("This account is suspended");
  }

  if (user.lockedUntil && user.lockedUntil > new Date() && !isDemoEmail(normalizedEmail)) {
    res.status(429);
    throw new Error("Invalid email or password");
  }

  let isMatch = Boolean(user.passwordHash) && (await bcrypt.compare(password, user.passwordHash));
  if (!isMatch && normalizedEmail === DEMO_EMAIL && password === DEMO_PASSWORD) {
    user.passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
    await user.save();
    isMatch = true;
  }

  if (!isMatch) {
    if (!isDemoEmail(normalizedEmail)) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      if (user.failedLoginAttempts >= MAX_FAILED_LOGIN_ATTEMPTS) {
        user.lockedUntil = new Date(Date.now() + LOGIN_LOCK_MS);
      }
      await user.save();
    }
    res.status(401);
    throw new Error("Invalid email or password");
  }

  user.failedLoginAttempts = 0;
  user.lockedUntil = undefined;
  user.lastLoginAt = new Date();
  if (isDemoEmail(normalizedEmail)) {
    user.emailVerified = true;
    user.emailVerifiedAt = user.emailVerifiedAt || new Date();
  }
  await user.save();

  await authResponse(res, user, "Logged in successfully");
});

export const demoLogin = asyncHandler(async (req, res) => {
  let user = await User.findOne({ email: DEMO_EMAIL });

  if (!user) {
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
    user = await User.create({
      name: "Abhijeet",
      email: DEMO_EMAIL,
      passwordHash,
      role: "user",
      avatar: "/clutchq-logo.svg",
      emailVerified: true,
      emailVerifiedAt: new Date()
    });
  }

  if (!user.emailVerified) {
    user.emailVerified = true;
    user.emailVerifiedAt = new Date();
    await user.save();
  }

  const profile = await GamerProfile.findOne({ userId: user._id });
  if (!profile) {
    await GamerProfile.create(createDemoProfile(user._id));
  }

  await authResponse(res, user, "Demo session started");
});

export const logout = asyncHandler(async (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: cookieOptions.sameSite,
    secure: cookieOptions.secure
  });

  res.json({
    success: true,
    message: "Logged out"
  });
});

export const requestOtp = asyncHandler(async (req, res) => {
  const { email, purpose = "email_verification" } = req.body;
  const normalizedEmail = normalizeEmail(email);

  if (!isValidEmail(normalizedEmail) || !PUBLIC_OTP_PURPOSES.has(purpose)) {
    res.status(400);
    throw new Error("Enter a valid email address.");
  }

  await verifyPublicTurnstile(req);
  const result = await createAndSendOtpIfEligible({ req, email: normalizedEmail, purpose });
  genericOtpSuccess(res, {
    retryAfterSeconds: result.retryAfterSeconds || result.resendSeconds || Number(process.env.OTP_RESEND_COOLDOWN_SECONDS || 60)
  });
});

export const verifyEmailOtp = asyncHandler(async (req, res) => {
  const { email, purpose = "email_verification", otp } = req.body;
  const normalizedEmail = normalizeEmail(email);

  if (!isValidEmail(normalizedEmail) || purpose !== "email_verification" || !/^\d{6}$/.test(String(otp || "").trim())) {
    res.status(400);
    throw new Error("Enter a valid verification code.");
  }

  const result = await verifyOtp({ email: normalizedEmail, purpose, otp });
  if (!result.success) {
    res.status(result.reason === "locked" ? 429 : 400);
    throw new Error(result.reason === "locked" ? "Too many wrong codes. Request a new OTP." : "Invalid or expired verification code.");
  }

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    res.status(400);
    throw new Error("Invalid or expired verification code.");
  }

  user.emailVerified = true;
  user.emailVerifiedAt = new Date();
  await user.save();

  res.json({
    success: true,
    message: "Email verified successfully.",
    data: {
      user: user.toSafeJSON ? user.toSafeJSON() : user
    }
  });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const normalizedEmail = normalizeEmail(email);

  if (!isValidEmail(normalizedEmail)) {
    res.status(400);
    throw new Error("Enter a valid email address.");
  }

  await verifyPublicTurnstile(req);
  const result = await createAndSendOtpIfEligible({ req, email: normalizedEmail, purpose: "password_reset" });
  genericOtpSuccess(res, {
    retryAfterSeconds: result.retryAfterSeconds || result.resendSeconds || Number(process.env.OTP_RESEND_COOLDOWN_SECONDS || 60)
  });
});

export const verifyPasswordResetOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  const normalizedEmail = normalizeEmail(email);

  if (!isValidEmail(normalizedEmail) || !/^\d{6}$/.test(String(otp || "").trim())) {
    res.status(400);
    throw new Error("Invalid or expired code.");
  }

  const result = await verifyOtp({ email: normalizedEmail, purpose: "password_reset", otp });
  if (!result.success) {
    res.status(result.reason === "locked" ? 429 : 400);
    throw new Error(result.reason === "locked" ? "Too many wrong codes. Request a new OTP." : "Invalid or expired code.");
  }

  const user = await User.findOne({ email: normalizedEmail });
  if (!user || !user.passwordHash) {
    res.status(400);
    throw new Error("Invalid or expired code.");
  }

  const { resetToken } = await createPasswordResetSession({
    email: normalizedEmail,
    ip: getRemoteIp(req),
    userAgent: req.get("user-agent")
  });

  res.json({
    success: true,
    message: "Code verified.",
    data: { resetToken }
  });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { resetToken, newPassword } = req.body;

  if (!resetToken) {
    res.status(400);
    throw new Error("Invalid or expired reset session.");
  }

  if (!strongEnoughPassword(newPassword)) {
    res.status(400);
    throw new Error("Password must be at least 8 characters and include a letter and a number.");
  }

  const sessionCheck = await verifyPasswordResetSession(resetToken);
  if (!sessionCheck.success) {
    res.status(400);
    throw new Error("Invalid or expired reset session.");
  }

  const consumed = await consumePasswordResetSession(resetToken);
  if (!consumed.success) {
    res.status(400);
    throw new Error("Invalid or expired reset session.");
  }

  const resetEmail = consumed.session.email;
  const user = await User.findOne({ email: resetEmail });
  if (!user || !user.passwordHash) {
    res.status(400);
    throw new Error("Unable to reset password. Request a new code.");
  }

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  user.failedLoginAttempts = 0;
  user.lockedUntil = undefined;
  user.emailVerified = true;
  user.emailVerifiedAt = user.emailVerifiedAt || new Date();
  await user.save();
  await invalidateOtps(resetEmail, "password_reset");

  res.json({
    success: true,
    message: "Password reset successfully."
  });
});

export const getSecurityHealth = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      smtpConfigured: Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS),
      turnstileConfigured: Boolean(process.env.TURNSTILE_SECRET_KEY),
      otpTtlMinutes: Number.parseInt(process.env.OTP_TTL_MINUTES || "10", 10)
    }
  });
});

export const startGoogleOAuth = asyncHandler(async (req, res) => {
  if (!isGoogleOAuthConfigured()) return redirectOAuthError(req, res, "google", "provider_not_configured");
  const state = createOAuthState(req, res, "google");
  res.redirect(buildGoogleAuthUrl(state));
});

export const handleGoogleOAuth = asyncHandler(async (req, res) => {
  try {
    if (!req.query.code || !verifyOAuthState(req, res, "google")) return redirectOAuthError(req, res, "google");
    const providerData = await handleGoogleOAuthCallback(req.query.code);
    const user = await createOrUpdateOAuthUser({ provider: "google", providerData });
    redirectOAuthSuccess(req, res, "google", user);
  } catch (error) {
    redirectOAuthError(req, res, "google");
  }
});

export const startDiscordOAuth = asyncHandler(async (req, res) => {
  if (!isDiscordOAuthConfigured()) return redirectOAuthError(req, res, "discord", "provider_not_configured");
  const state = createOAuthState(req, res, "discord");
  res.redirect(buildDiscordAuthUrl(state));
});

export const startSteamOAuth = asyncHandler(async (req, res) => {
  res.redirect(buildSteamAuthUrl({ returnTo: getRequestClientOrigin(req), token: req.query.token, next: req.query.next }));
});

export const handleSteamOAuth = asyncHandler(async (req, res) => {
  try {
    const steamId = await verifySteamOpenId(req.query);
    let summary = null;
    try {
      summary = await getPlayerSummary(steamId);
    } catch {
      summary = null;
    }
    const user = await createOrUpdateSteamUser({ req, steamId, summary });
    redirectOAuthSuccess(req, res, null, user, "/profile");
  } catch (error) {
    redirectOAuthError(req, res, null, "oauth_failed");
  }
});

export const handleDiscordOAuth = asyncHandler(async (req, res) => {
  try {
    if (!req.query.code || !verifyOAuthState(req, res, "discord")) return redirectOAuthError(req, res, "discord");
    const providerData = await handleDiscordOAuthCallback(req.query.code);
    const user = await createOrUpdateOAuthUser({ provider: "discord", providerData });
    redirectOAuthSuccess(req, res, "discord", user);
  } catch (error) {
    redirectOAuthError(req, res, "discord");
  }
});

export const providerNotConfigured = (providerLabel) =>
  asyncHandler(async (req, res) => {
    if (req.accepts("html")) {
      return redirectOAuthError(req, res, null, "provider_not_configured");
    }

    res.status(501).json({
      success: false,
      message: `${providerLabel} login is not configured yet.`
    });
  });

export const getMe = asyncHandler(async (req, res) => {
  const profile = await GamerProfile.findOne({ userId: req.user._id });

  res.json({
    success: true,
    message: "Current user loaded",
    data: {
      user: req.user.toSafeJSON ? req.user.toSafeJSON() : req.user,
      profile
    }
  });
});
