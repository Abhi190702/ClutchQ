import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import GamerProfile from "../models/GamerProfile.js";
import generateToken from "../utils/generateToken.js";
import { asyncHandler } from "../middleware/errorMiddleware.js";
import { createDemoProfile, demoAccounts } from "../utils/seedData.js";
import { buildDiscordAuthUrl, handleDiscordOAuthCallback, isDiscordOAuthConfigured } from "../services/oauth/discordOAuthService.js";
import { buildGoogleAuthUrl, handleGoogleOAuthCallback, isGoogleOAuthConfigured } from "../services/oauth/googleOAuthService.js";
import { sendOtpEmail } from "../services/emailService.js";
import { createOtp, invalidateOtps, verifyOtp } from "../services/otpService.js";
import {
  consumePasswordResetSession,
  createPasswordResetSession
} from "../services/passwordResetSessionService.js";
import {
  buildSteamAuthUrl,
  getPlayerSummary,
  removeStaleSteamAccountData,
  verifySteamOpenId
} from "../services/steamService.js";
import { verifyTurnstileToken } from "../services/turnstileService.js";
import { getJwtSecret } from "../utils/validateEnv.js";
import { isLocalDevelopment } from "../utils/runtimeEnv.js";
import { consumeOAuthLoginCode, createOAuthLoginCode } from "../services/oauthLoginCodeService.js";
import { isSharedDemoEmail as isDemoEmail } from "../utils/demoAccounts.js";
import { cleanTextInput } from "../utils/inputValue.js";

const isLocalDev = isLocalDevelopment();
const useSecureCookies = !isLocalDev;

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
const oauthStateClearOptions = {
  httpOnly: true,
  sameSite: oauthStateCookieOptions.sameSite,
  secure: oauthStateCookieOptions.secure
};

const oauthStateCookieName = (provider) => `clutchq_${provider}_oauth_state`;
const oauthReturnCookieName = (provider) => `clutchq_${provider}_oauth_return_to`;
const oauthNextCookieName = (provider) => `clutchq_${provider}_oauth_next`;
const oauthLinkCookieName = (provider) => `clutchq_${provider}_oauth_link`;
const DEMO_EMAIL = "demo@clutchq.com";
const DEMO_PASSWORD = "demo123";
const DUMMY_PASSWORD_HASH = "$2a$10$zS5JSaSUOCHlYZ/pgXexUOAUlfCjvMy22RDAIg/pmGAtuV1Lqy4Hq";
const MAX_FAILED_LOGIN_ATTEMPTS = 10;
const LOGIN_LOCK_MS = 15 * 60 * 1000;
const OTP_PUBLIC_MESSAGE = "If this email can receive a code, an OTP has been sent.";
const MAX_PASSWORD_BYTES = 72;
const PUBLIC_OTP_PURPOSES = new Set(["email_verification"]);
const LINKABLE_OAUTH_PROVIDERS = new Set(["google", "discord", "steam"]);
const normalizeEmail = (email) => String(email || "").trim().toLowerCase();
const safeNextPath = (value) => (typeof value === "string" && value.startsWith("/") && !value.startsWith("//") ? value : null);
const isValidEmail = (email) => {
  const normalized = normalizeEmail(email);
  return normalized.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
};
const cleanPersonName = (value) => cleanTextInput(value, 80);
const cleanExternalUrl = (value) => {
  const text = String(value || "").trim();
  if (!text || text.length > 2048) return undefined;
  try {
    const parsed = new URL(text);
    return parsed.protocol === "https:" ? parsed.toString() : undefined;
  } catch {
    return undefined;
  }
};
const resetSharedDemoProfile = async (user) => {
  const index = demoAccounts.findIndex((account) => normalizeEmail(account.email) === normalizeEmail(user?.email));
  if (index < 0) return null;
  return GamerProfile.findOneAndUpdate(
    { userId: user._id },
    {
      $set: createDemoProfile(user._id, demoAccounts[index], index),
      $unset: { customAvatar: "" }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
  );
};
const validPasswordInput = (password) =>
  typeof password === "string" && Buffer.byteLength(password, "utf8") > 0 && Buffer.byteLength(password, "utf8") <= MAX_PASSWORD_BYTES;
const strongEnoughPassword = (password) => {
  if (!validPasswordInput(password)) return false;
  const value = password;
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
  const user = await User.findOne({ email: normalizedEmail }).select("+passwordHash");
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

  try {
    await sendOtpEmail({ to: normalizedEmail, otp: created.otp, purpose });
  } catch (error) {
    await invalidateOtps(normalizedEmail, purpose);
    console.error(`[${req.id || "no-request-id"}] OTP delivery failed:`, error.message);
    return { sent: false, deliveryFailed: true };
  }
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
    return isLocalDev && ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  } catch {
    return false;
  }
};

const configuredClientOrigin = () =>
  normalizeUrl(isLocalDev ? process.env.LOCAL_CLIENT_URL || "http://localhost:5173" : process.env.CLIENT_URL || "https://clutch-q.vercel.app");

const allowedClientOrigins = () =>
  new Set(
    [
      ...(isLocalDev ? ["http://localhost:5173", "http://localhost:5174"] : []),
      "https://clutch-q.vercel.app",
      process.env.CLIENT_URL,
      ...(isLocalDev ? [process.env.LOCAL_CLIENT_URL] : []),
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
  res.clearCookie(cookieName, oauthStateClearOptions);
  return isAllowedClientOrigin(stored) ? stored : configuredClientOrigin();
};

const getStoredNextPath = (req, res, provider) => {
  const cookieName = oauthNextCookieName(provider);
  const stored = safeNextPath(req.cookies?.[cookieName]);
  res.clearCookie(cookieName, oauthStateClearOptions);
  return stored;
};

const getClientRedirect = (path, clientOrigin = configuredClientOrigin()) => `${clientOrigin}${path}`;

const redirectOAuthError = (req, res, provider, error = "oauth_failed") => {
  const clientOrigin = provider ? getStoredClientOrigin(req, res, provider) : getRequestClientOrigin(req);
  if (provider) {
    getStoredNextPath(req, res, provider);
    res.clearCookie(oauthLinkCookieName(provider), oauthStateClearOptions);
  }
  res.redirect(getClientRedirect(`/login?error=${encodeURIComponent(error)}`, clientOrigin));
};

export const prepareOAuthLinkCookie = async (req, res, provider) => {
  const linkCode = typeof req.query.linkCode === "string" ? req.query.linkCode : "";
  if (!linkCode) {
    res.clearCookie(oauthLinkCookieName(provider), oauthStateClearOptions);
    return true;
  }
  const session = await consumeOAuthLoginCode(linkCode, { purpose: "link", provider });
  if (!session) return false;

  const linkToken = jwt.sign(
    {
      id: String(session.userId),
      version: Number(session.tokenVersion) || 0,
      purpose: "oauth-link",
      provider
    },
    getJwtSecret(),
    {
      algorithm: "HS256",
      issuer: "clutchq-api",
      audience: "clutchq-oauth-link",
      expiresIn: "10m"
    }
  );
  res.cookie(oauthLinkCookieName(provider), linkToken, oauthStateCookieOptions);
  return true;
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
  const expectedState = String(req.cookies?.[cookieName] || "");
  const returnedState = typeof req.query.state === "string" ? req.query.state : "";
  res.clearCookie(cookieName, oauthStateClearOptions);
  if (!expectedState || expectedState.length !== returnedState.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expectedState), Buffer.from(returnedState));
};

const issueToken = (res, user) => {
  const token = generateToken(user._id, user.tokenVersion);
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

const findUserForProvider = async (provider, providerId, email, emailVerified = false) => {
  const providerPath = `authProviders.${provider}.id`;
  const byProvider = await User.findOne({ [providerPath]: providerId });
  if (byProvider) return byProvider;
  if (!email || !emailVerified) return null;
  return User.findOne({ email: email.toLowerCase() });
};

const createOrUpdateOAuthUser = async ({ provider, providerData, req }) => {
  const providerId = String(providerData.id || "").trim().slice(0, 200);
  if (!providerId) {
    const error = new Error("OAuth provider did not return a valid account identifier.");
    error.statusCode = 400;
    throw error;
  }
  const candidateEmail = normalizeEmail(providerData.email);
  const verifiedEmail = providerData.emailVerified && isValidEmail(candidateEmail) ? candidateEmail : "";
  const fallbackEmail = verifiedEmail || `${provider}-${providerId}@${provider}.clutchq.local`;
  const user = await findUserForProvider(provider, providerId, verifiedEmail, Boolean(verifiedEmail));
  const name = cleanPersonName(providerData.name || providerData.globalName || providerData.username || fallbackEmail.split("@")[0]);
  const existingProviderOwner = await User.findOne({ [`authProviders.${provider}.id`]: providerId });
  const linkUser = await getLinkUserFromRequest(req, provider);

  if (linkUser && isDemoEmail(linkUser.email)) {
    const error = new Error("External accounts cannot be connected to the shared demo profile.");
    error.statusCode = 403;
    throw error;
  }

  if (linkUser && existingProviderOwner && String(existingProviderOwner._id) !== String(linkUser._id)) {
    const error = new Error(`This ${provider} account is already connected to another ClutchQ account.`);
    error.statusCode = 409;
    throw error;
  }

  if (linkUser && verifiedEmail) {
    const emailOwner = await User.findOne({ email: verifiedEmail, _id: { $ne: linkUser._id } }).select("_id");
    if (emailOwner) {
      const error = new Error("That verified email belongs to another ClutchQ account.");
      error.statusCode = 409;
      throw error;
    }
  }

  const targetUser = linkUser || user;
  const previousProvider = targetUser?.authProviders?.[provider] || {};
  const cleanProviderData = {
    ...providerData,
    id: providerId,
    email: verifiedEmail || normalizeEmail(providerData.email) || undefined,
    avatar: cleanExternalUrl(providerData.avatar),
    connectedAt: previousProvider.connectedAt || providerData.connectedAt || new Date()
  };

  if (linkUser) {
    const canAdoptVerifiedEmail = verifiedEmail && String(linkUser.email || "").endsWith(".clutchq.local");
    linkUser.name = linkUser.name || name;
    if (canAdoptVerifiedEmail) linkUser.email = verifiedEmail;
    linkUser.avatar = linkUser.avatar || cleanProviderData.avatar;
    if (verifiedEmail && (canAdoptVerifiedEmail || normalizeEmail(linkUser.email) === verifiedEmail)) {
      linkUser.emailVerified = true;
      linkUser.emailVerifiedAt = linkUser.emailVerifiedAt || new Date();
    }
    linkUser.authProviders = {
      ...(linkUser.authProviders?.toObject?.() || linkUser.authProviders || {}),
      [provider]: cleanProviderData
    };
    await linkUser.save();
    return linkUser;
  }

  if (user) {
    if (verifiedEmail && String(user.email || "").endsWith(".clutchq.local")) {
      const emailOwner = await User.exists({ email: verifiedEmail, _id: { $ne: user._id } });
      if (!emailOwner) user.email = verifiedEmail;
    }
    user.name = user.name || name;
    user.email = user.email || fallbackEmail;
    user.avatar = cleanProviderData.avatar || user.avatar;
    user.emailVerified = user.emailVerified || Boolean(verifiedEmail && normalizeEmail(user.email) === verifiedEmail);
    user.emailVerifiedAt = user.emailVerified ? user.emailVerifiedAt || new Date() : undefined;
    user.authProviders = {
      ...(user.authProviders?.toObject?.() || user.authProviders || {}),
      [provider]: cleanProviderData
    };
    await user.save();
    return user;
  }

  try {
    return await User.create({
      name,
      email: fallbackEmail,
      avatar: cleanProviderData.avatar,
      emailVerified: Boolean(verifiedEmail),
      emailVerifiedAt: verifiedEmail ? new Date() : undefined,
      authProviders: {
        [provider]: cleanProviderData
      }
    });
  } catch (error) {
    if (error?.code !== 11000) throw error;
    const winner = await findUserForProvider(provider, providerId, verifiedEmail, Boolean(verifiedEmail));
    if (winner) return winner;
    throw error;
  }
};

const redirectOAuthSuccess = async (req, res, provider, user, nextPath = null) => {
  const clientOrigin = provider ? getStoredClientOrigin(req, res, provider) : getRequestClientOrigin(req);
  const code = await createOAuthLoginCode(user._id, { tokenVersion: user.tokenVersion });
  const params = new URLSearchParams({ code });
  const safeNext = safeNextPath(nextPath) || (provider ? getStoredNextPath(req, res, provider) : null) || safeNextPath(req.query.next);
  if (safeNext) params.set("next", safeNext);
  if (provider) res.clearCookie(oauthLinkCookieName(provider), oauthStateClearOptions);
  res.redirect(getClientRedirect(`/oauth/success?${params.toString()}`, clientOrigin));
};

export const getLinkUserFromRequest = async (req, provider) => {
  const linkToken = provider ? req?.cookies?.[oauthLinkCookieName(provider)] : null;
  if (linkToken) {
    try {
      const decoded = jwt.verify(linkToken, getJwtSecret(), {
        algorithms: ["HS256"],
        issuer: "clutchq-api",
        audience: "clutchq-oauth-link"
      });
      if (decoded.purpose === "oauth-link" && decoded.provider === provider) {
        const linkUser = await User.findById(decoded.id);
        if (
          linkUser &&
          !linkUser.isSuspended &&
          (Number(decoded.version) || 0) === (Number(linkUser.tokenVersion) || 0)
        ) {
          return linkUser;
        }
      }
    } catch {
      // Handled below with the same safe error as any invalid link handoff.
    }
    const error = new Error("OAuth account connection expired. Start the connection again.");
    error.statusCode = 401;
    throw error;
  }

  // Normal OAuth sign-in must never become an account-link operation merely
  // because the browser still has a ClutchQ session cookie. Linking is allowed
  // only through the short-lived, provider-bound handoff created by the
  // authenticated /oauth/link-code route.
  return null;
};

const createOrUpdateSteamUser = async ({ req, steamId, summary }) => {
  const linkUser = await getLinkUserFromRequest(req, "steam");
  const existingSteamOwner = await User.findOne({ "authProviders.steam.steamId": steamId });
  const buildSteamData = (existingProvider = {}) => ({
    steamId,
    displayName: String(summary?.personaname || existingProvider.displayName || `Steam ${steamId.slice(-6)}`).slice(0, 200),
    avatar: cleanExternalUrl(summary?.avatarfull || summary?.avatarmedium) || existingProvider.avatar,
    profileUrl:
      cleanExternalUrl(summary?.profileurl) || existingProvider.profileUrl || `https://steamcommunity.com/profiles/${steamId}`,
    level: existingProvider.level,
    connectedAt: existingProvider.connectedAt || new Date(),
    lastSyncedAt: existingProvider.lastSyncedAt
  });

  if (linkUser) {
    if (isDemoEmail(linkUser.email)) {
      const error = new Error("Steam cannot be connected to the shared demo profile.");
      error.statusCode = 403;
      throw error;
    }
    if (existingSteamOwner && String(existingSteamOwner._id) !== String(linkUser._id)) {
      const error = new Error("This Steam account is already connected to another ClutchQ account.");
      error.statusCode = 409;
      throw error;
    }
    const previousSteamProvider = linkUser.authProviders?.steam || {};
    const previousSteamId = previousSteamProvider.steamId;
    const steamData = buildSteamData(previousSteamId === steamId ? previousSteamProvider : {});
    linkUser.authProviders = {
      ...(linkUser.authProviders?.toObject?.() || linkUser.authProviders || {}),
      steam: steamData
    };
    linkUser.avatar = linkUser.avatar || steamData.avatar;
    await linkUser.save();
    if (previousSteamId && previousSteamId !== steamId) {
      await removeStaleSteamAccountData(linkUser._id, steamId).catch((error) => {
        console.error(`[${req.id || "no-request-id"}] Old Steam data cleanup failed:`, error.message);
      });
    }
    return linkUser;
  }

  const existing = existingSteamOwner;
  if (existing) {
    const steamData = buildSteamData(existing.authProviders?.steam || {});
    existing.name = existing.name || steamData.displayName;
    existing.avatar = steamData.avatar || existing.avatar;
    if (String(existing.email || "").endsWith("@steam.clutchq.local")) {
      existing.emailVerified = false;
      existing.emailVerifiedAt = undefined;
    }
    existing.authProviders = {
      ...(existing.authProviders?.toObject?.() || existing.authProviders || {}),
      steam: steamData
    };
    await existing.save();
    return existing;
  }

  const steamData = buildSteamData();
  const user = await User.create({
    name: steamData.displayName,
    email: `steam-${steamId}@steam.clutchq.local`,
    avatar: steamData.avatar,
    emailVerified: false,
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

  const cleanName = cleanPersonName(name);

  if (!cleanName || !normalizedEmail || !password) {
    res.status(400);
    throw new Error("Name, email, and password are required");
  }

  if (cleanName.length < 2 || cleanName.length > 80 || !isValidEmail(normalizedEmail)) {
    res.status(400);
    throw new Error("Enter a valid name and email address.");
  }

  if (!strongEnoughPassword(password)) {
    res.status(400);
    throw new Error("Password must be 8 to 72 bytes and include a letter and a number.");
  }

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    res.status(409);
    throw new Error("Unable to create account. Please use different details or sign in.");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const avatarSeed = crypto.createHash("sha256").update(normalizedEmail).digest("hex").slice(0, 24);
  const user = await User.create({
    name: cleanName,
    email: normalizedEmail,
    passwordHash,
    emailVerified: false,
    avatar: `https://api.dicebear.com/8.x/identicon/svg?seed=${avatarSeed}`
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

  if (!isValidEmail(normalizedEmail) || !validPasswordInput(password)) {
    await bcrypt.compare("invalid-password", DUMMY_PASSWORD_HASH);
    res.status(401);
    throw new Error("Invalid email or password");
  }

  const user = await User.findOne({ email: normalizedEmail }).select("+passwordHash");
  if (!user) {
    await bcrypt.compare(String(password), DUMMY_PASSWORD_HASH);
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
  if (user.lockedUntil && user.lockedUntil <= new Date()) {
    user.failedLoginAttempts = 0;
    user.lockedUntil = undefined;
  }

  let isMatch = await bcrypt.compare(password, user.passwordHash || DUMMY_PASSWORD_HASH);
  isMatch = Boolean(user.passwordHash) && isMatch;
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
  if (isDemoEmail(normalizedEmail)) await resetSharedDemoProfile(user);

  await authResponse(res, user, "Logged in successfully");
});

export const demoLogin = asyncHandler(async (req, res) => {
  let user = await User.findOne({ email: DEMO_EMAIL });

  if (!user) {
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
    try {
      user = await User.create({
        name: "Abhijeet",
        email: DEMO_EMAIL,
        passwordHash,
        role: "user",
        avatar: "/clutchq-logo.svg",
        emailVerified: true,
        emailVerifiedAt: new Date()
      });
    } catch (error) {
      if (error?.code !== 11000) throw error;
      user = await User.findOne({ email: DEMO_EMAIL });
    }
  }

  if (!user || user.isSuspended) {
    res.status(403);
    throw new Error("This account is suspended");
  }

  if (!user.emailVerified) {
    user.emailVerified = true;
    user.emailVerifiedAt = new Date();
    await user.save();
  }

  await resetSharedDemoProfile(user);

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

export const exchangeOAuthCode = asyncHandler(async (req, res) => {
  const session = await consumeOAuthLoginCode(req.body?.code, { purpose: "login" });
  if (!session) {
    res.status(400);
    throw new Error("OAuth sign-in session is invalid or expired.");
  }

  const user = await User.findOne({ _id: session.userId, isSuspended: { $ne: true } });
  if (!user) {
    res.status(400);
    throw new Error("OAuth sign-in session is invalid or expired.");
  }
  if ((Number(session.tokenVersion) || 0) !== (Number(user.tokenVersion) || 0)) {
    res.status(400);
    throw new Error("OAuth sign-in session is invalid or expired.");
  }

  user.lastLoginAt = new Date();
  await user.save();
  await authResponse(res, user, "Signed in successfully");
});

export const createOAuthLinkCode = asyncHandler(async (req, res) => {
  const provider = cleanTextInput(req.body?.provider, 20).toLowerCase();
  if (!LINKABLE_OAUTH_PROVIDERS.has(provider)) {
    res.status(400);
    throw new Error("This account provider cannot be connected yet.");
  }
  if (isDemoEmail(req.user.email)) {
    res.status(403);
    throw new Error("External accounts cannot be connected to the shared demo profile.");
  }
  if (provider === "google" && !isGoogleOAuthConfigured()) {
    res.status(503);
    throw new Error("Google sign-in is not configured yet.");
  }
  if (provider === "discord" && !isDiscordOAuthConfigured()) {
    res.status(503);
    throw new Error("Discord sign-in is not configured yet.");
  }

  const code = await createOAuthLoginCode(req.user._id, {
    purpose: "link",
    provider,
    tokenVersion: req.user.tokenVersion
  });
  res.json({
    success: true,
    message: "Secure account connection prepared.",
    data: { code }
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

  const user = await User.findOne({ email: normalizedEmail }).select("+passwordHash");
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
    throw new Error("Password must be 8 to 72 bytes and include a letter and a number.");
  }

  const consumed = await consumePasswordResetSession(resetToken);
  if (!consumed.success) {
    res.status(400);
    throw new Error("Invalid or expired reset session.");
  }

  const resetEmail = consumed.session.email;
  const user = await User.findOne({ email: resetEmail }).select("+passwordHash");
  if (!user || !user.passwordHash) {
    res.status(400);
    throw new Error("Unable to reset password. Request a new code.");
  }

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  user.failedLoginAttempts = 0;
  user.lockedUntil = undefined;
  user.emailVerified = true;
  user.emailVerifiedAt = user.emailVerifiedAt || new Date();
  user.tokenVersion = (Number(user.tokenVersion) || 0) + 1;
  await user.save();
  await invalidateOtps(resetEmail, "password_reset");

  res.clearCookie("token", {
    httpOnly: true,
    sameSite: cookieOptions.sameSite,
    secure: cookieOptions.secure
  });

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
  if (!(await prepareOAuthLinkCookie(req, res, "google"))) return redirectOAuthError(req, res, "google", "oauth_link_expired");
  const state = createOAuthState(req, res, "google");
  res.redirect(buildGoogleAuthUrl(state));
});

export const handleGoogleOAuth = asyncHandler(async (req, res) => {
  try {
    const stateValid = verifyOAuthState(req, res, "google");
    if (!req.query.code || !stateValid) return redirectOAuthError(req, res, "google");
    const providerData = await handleGoogleOAuthCallback(req.query.code);
    const user = await createOrUpdateOAuthUser({ provider: "google", providerData, req });
    await redirectOAuthSuccess(req, res, "google", user);
  } catch (error) {
    console.error(`[${req.id || "no-request-id"}] Google OAuth callback failed:`, error.message);
    redirectOAuthError(req, res, "google");
  }
});

export const startDiscordOAuth = asyncHandler(async (req, res) => {
  if (!isDiscordOAuthConfigured()) return redirectOAuthError(req, res, "discord", "provider_not_configured");
  if (!(await prepareOAuthLinkCookie(req, res, "discord"))) return redirectOAuthError(req, res, "discord", "oauth_link_expired");
  const state = createOAuthState(req, res, "discord");
  res.redirect(buildDiscordAuthUrl(state));
});

export const startSteamOAuth = asyncHandler(async (req, res) => {
  if (!(await prepareOAuthLinkCookie(req, res, "steam"))) return redirectOAuthError(req, res, "steam", "oauth_link_expired");
  const state = createOAuthState(req, res, "steam");
  res.redirect(buildSteamAuthUrl({ state }));
});

export const handleSteamOAuth = asyncHandler(async (req, res) => {
  try {
    if (!verifyOAuthState(req, res, "steam")) return redirectOAuthError(req, res, "steam");
    const steamId = await verifySteamOpenId(req.query);
    let summary = null;
    try {
      summary = await getPlayerSummary(steamId);
    } catch {
      summary = null;
    }
    const user = await createOrUpdateSteamUser({ req, steamId, summary });
    await redirectOAuthSuccess(req, res, "steam", user, "/profile");
  } catch (error) {
    console.error(`[${req.id || "no-request-id"}] Steam OAuth callback failed:`, error.message);
    redirectOAuthError(req, res, "steam", "oauth_failed");
  }
});

export const handleDiscordOAuth = asyncHandler(async (req, res) => {
  try {
    const stateValid = verifyOAuthState(req, res, "discord");
    if (!req.query.code || !stateValid) return redirectOAuthError(req, res, "discord");
    const providerData = await handleDiscordOAuthCallback(req.query.code);
    const user = await createOrUpdateOAuthUser({ provider: "discord", providerData, req });
    await redirectOAuthSuccess(req, res, "discord", user);
  } catch (error) {
    console.error(`[${req.id || "no-request-id"}] Discord OAuth callback failed:`, error.message);
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
