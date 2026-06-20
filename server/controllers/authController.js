import bcrypt from "bcryptjs";
import crypto from "crypto";
import User from "../models/User.js";
import GamerProfile from "../models/GamerProfile.js";
import generateToken from "../utils/generateToken.js";
import { asyncHandler } from "../middleware/errorMiddleware.js";
import { createDemoProfile } from "../utils/seedData.js";
import { buildDiscordAuthUrl, handleDiscordOAuthCallback, isDiscordOAuthConfigured } from "../services/oauth/discordOAuthService.js";
import { buildGoogleAuthUrl, handleGoogleOAuthCallback, isGoogleOAuthConfigured } from "../services/oauth/googleOAuthService.js";

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

const getClientRedirect = (path, clientOrigin = configuredClientOrigin()) => `${clientOrigin}${path}`;

const redirectOAuthError = (req, res, provider, error = "oauth_failed") => {
  const clientOrigin = provider ? getStoredClientOrigin(req, res, provider) : getRequestClientOrigin(req);
  res.redirect(getClientRedirect(`/login?error=${encodeURIComponent(error)}`, clientOrigin));
};

const createOAuthState = (req, res, provider) => {
  const state = crypto.randomBytes(24).toString("hex");
  res.cookie(oauthStateCookieName(provider), state, oauthStateCookieOptions);
  res.cookie(oauthReturnCookieName(provider), getRequestClientOrigin(req), oauthStateCookieOptions);
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
    authProviders: {
      [provider]: providerData
    }
  });
};

const redirectOAuthSuccess = (req, res, provider, user) => {
  const clientOrigin = getStoredClientOrigin(req, res, provider);
  const token = issueToken(res, user);
  res.redirect(getClientRedirect(`/oauth/success?token=${encodeURIComponent(token)}`, clientOrigin));
};

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Name, email, and password are required");
  }

  if (password.length < 6) {
    res.status(400);
    throw new Error("Password must be at least 6 characters");
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    res.status(409);
    throw new Error("An account with this email already exists");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email,
    passwordHash,
    avatar: `https://api.dicebear.com/8.x/identicon/svg?seed=${encodeURIComponent(email)}`
  });

  res.status(201);
  await authResponse(res, user, "Account created successfully");
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Email and password are required");
  }

  const user = await User.findOne({ email });
  if (!user) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  if (user.isSuspended) {
    res.status(403);
    throw new Error("This account is suspended");
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  await authResponse(res, user, "Logged in successfully");
});

export const demoLogin = asyncHandler(async (req, res) => {
  let user = await User.findOne({ email: "demo@clutchq.com" });

  if (!user) {
    const passwordHash = await bcrypt.hash("demo123", 10);
    user = await User.create({
      name: "Abhijeet",
      email: "demo@clutchq.com",
      passwordHash,
      role: "user",
      avatar: "/clutchq-logo.svg"
    });
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
