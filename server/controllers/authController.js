import bcrypt from "bcryptjs";
import crypto from "crypto";
import User from "../models/User.js";
import GamerProfile from "../models/GamerProfile.js";
import generateToken from "../utils/generateToken.js";
import { asyncHandler } from "../middleware/errorMiddleware.js";
import { buildDiscordAuthUrl, handleDiscordOAuthCallback, isDiscordOAuthConfigured } from "../services/oauth/discordOAuthService.js";
import { buildGoogleAuthUrl, handleGoogleOAuthCallback, isGoogleOAuthConfigured } from "../services/oauth/googleOAuthService.js";

const cookieOptions = {
  httpOnly: true,
  maxAge: 30 * 24 * 60 * 60 * 1000,
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  secure: process.env.NODE_ENV === "production"
};

const oauthStateCookieOptions = {
  httpOnly: true,
  maxAge: 10 * 60 * 1000,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production"
};

const oauthStateCookieName = (provider) => `clutchq_${provider}_oauth_state`;

const getClientRedirect = (path) => `${process.env.CLIENT_URL || "http://localhost:5173"}${path}`;

const redirectOAuthError = (res, error = "oauth_failed") => {
  res.redirect(getClientRedirect(`/login?error=${encodeURIComponent(error)}`));
};

const createOAuthState = (res, provider) => {
  const state = crypto.randomBytes(24).toString("hex");
  res.cookie(oauthStateCookieName(provider), state, oauthStateCookieOptions);
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

const redirectOAuthSuccess = (res, user) => {
  const token = issueToken(res, user);
  res.redirect(getClientRedirect(`/oauth/success?token=${encodeURIComponent(token)}`));
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
  const user = await User.findOne({ email: "demo@clutchq.com" });

  if (!user) {
    res.status(404);
    throw new Error("Demo account not found. Run npm run seed first.");
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
  if (!isGoogleOAuthConfigured()) return redirectOAuthError(res, "provider_not_configured");
  const state = createOAuthState(res, "google");
  res.redirect(buildGoogleAuthUrl(state));
});

export const handleGoogleOAuth = asyncHandler(async (req, res) => {
  try {
    if (!req.query.code || !verifyOAuthState(req, res, "google")) return redirectOAuthError(res);
    const providerData = await handleGoogleOAuthCallback(req.query.code);
    const user = await createOrUpdateOAuthUser({ provider: "google", providerData });
    redirectOAuthSuccess(res, user);
  } catch (error) {
    redirectOAuthError(res);
  }
});

export const startDiscordOAuth = asyncHandler(async (req, res) => {
  if (!isDiscordOAuthConfigured()) return redirectOAuthError(res, "provider_not_configured");
  const state = createOAuthState(res, "discord");
  res.redirect(buildDiscordAuthUrl(state));
});

export const handleDiscordOAuth = asyncHandler(async (req, res) => {
  try {
    if (!req.query.code || !verifyOAuthState(req, res, "discord")) return redirectOAuthError(res);
    const providerData = await handleDiscordOAuthCallback(req.query.code);
    const user = await createOrUpdateOAuthUser({ provider: "discord", providerData });
    redirectOAuthSuccess(res, user);
  } catch (error) {
    redirectOAuthError(res);
  }
});

export const providerNotConfigured = (providerLabel) =>
  asyncHandler(async (req, res) => {
    if (req.accepts("html")) {
      return redirectOAuthError(res, "provider_not_configured");
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
