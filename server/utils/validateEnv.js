import { isProductionRuntime } from "./runtimeEnv.js";

const isProduction = isProductionRuntime;

const requiredProductionKeys = ["MONGO_URI", "JWT_SECRET", "CLIENT_URL", "SERVER_URL"];
const placeholderValues = new Set([
  "replace_with_secure_secret",
  "your_long_secret",
  "your_mongodb_atlas_uri",
  "your-vercel-frontend-url",
  "..."
]);

const optionalIntegrations = [
  ["Google OAuth", ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_CALLBACK_URL"]],
  ["Discord OAuth", ["DISCORD_CLIENT_ID", "DISCORD_CLIENT_SECRET", "DISCORD_CALLBACK_URL"]],
  ["Discord voice rooms", ["DISCORD_BOT_TOKEN", "DISCORD_GUILD_ID"]],
  ["Steam integration", ["STEAM_API_KEY"]],
  ["Epic Games OAuth", ["EPIC_CLIENT_ID", "EPIC_CLIENT_SECRET", "EPIC_CALLBACK_URL"]],
  ["Microsoft OAuth", ["MICROSOFT_CLIENT_ID", "MICROSOFT_CLIENT_SECRET", "MICROSOFT_CALLBACK_URL"]],
  ["Cloudflare Turnstile", ["TURNSTILE_SECRET_KEY"]],
  ["OTP email SMTP", ["SMTP_HOST", "SMTP_USER", "SMTP_PASS"]]
];

const present = (key) => Boolean(String(process.env[key] || "").trim());
const valueFor = (key) => String(process.env[key] || "").trim();

const isPlaceholder = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  return !normalized || placeholderValues.has(normalized) || normalized.startsWith("your_");
};

const assertValidUrl = (key, { requireHttps = isProduction(), originOnly = false } = {}) => {
  const value = valueFor(key);
  try {
    const parsed = new URL(value);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw new Error("invalid protocol");
    }
    if (!parsed.hostname || parsed.username || parsed.password) throw new Error("invalid host");
    if (requireHttps && parsed.protocol !== "https:") throw new Error("production URL must use HTTPS");
    if (originOnly && (parsed.pathname !== "/" || parsed.search || parsed.hash)) throw new Error("URL must be an origin");
  } catch {
    throw new Error(`${key} must be a valid http(s) URL.`);
  }
};

const validateOptionalCallback = (callbackKey, credentialKeys, { alwaysActive = false } = {}) => {
  if (!present(callbackKey)) return;
  const integrationEnabled = alwaysActive || credentialKeys.every(present);
  assertValidUrl(callbackKey, { requireHttps: isProduction() && integrationEnabled });
};

const assertValidMongoUri = () => {
  const value = valueFor("MONGO_URI");
  if (!/^mongodb(?:\+srv)?:\/\//i.test(value)) {
    throw new Error("MONGO_URI must be a valid mongodb:// or mongodb+srv:// connection string.");
  }
};

const assertBoundedInteger = (key, minimum, maximum) => {
  if (!present(key)) return;
  const raw = valueFor(key);
  const value = /^\d+$/.test(raw) ? Number(raw) : Number.NaN;
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum) {
    throw new Error(`${key} must be between ${minimum} and ${maximum}.`);
  }
};

const assertProductionSecret = () => {
  const secret = valueFor("JWT_SECRET");
  if (isPlaceholder(secret) || secret.length < 32) {
    throw new Error("JWT_SECRET must be a real production secret with at least 32 characters.");
  }
};

const assertJwtLifetime = () => {
  if (!present("JWT_EXPIRES_IN")) return;
  const match = valueFor("JWT_EXPIRES_IN").match(/^(\d+)([smhd])$/i);
  const unitMs = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  const lifetimeMs = match ? Number(match[1]) * unitMs[match[2].toLowerCase()] : 0;
  if (!Number.isSafeInteger(lifetimeMs) || lifetimeMs < 5 * 60_000 || lifetimeMs > 30 * 86_400_000) {
    throw new Error("JWT_EXPIRES_IN must be between 5 minutes and 30 days, for example 7d.");
  }
};

export const getJwtSecret = () => {
  if (present("JWT_SECRET")) return process.env.JWT_SECRET;
  if (isProduction()) throw new Error("JWT_SECRET is required in production.");
  return "dev_secret_replace_me";
};

export const validateEnv = () => {
  if (isProduction()) {
    const missing = requiredProductionKeys.filter((key) => !present(key));
    if (missing.length) {
      throw new Error(`Missing required production environment variables: ${missing.join(", ")}`);
    }

    const placeholders = requiredProductionKeys.filter((key) => isPlaceholder(process.env[key]));
    if (placeholders.length) {
      throw new Error(`Replace placeholder production environment variables: ${placeholders.join(", ")}`);
    }

    assertProductionSecret();
    assertValidMongoUri();
    assertValidUrl("CLIENT_URL", { originOnly: true });
    assertValidUrl("SERVER_URL", { originOnly: true });

    const placeholderOptionalKeys = optionalIntegrations
      .flatMap(([, keys]) => keys)
      .filter((key) => present(key) && isPlaceholder(valueFor(key)));
    if (placeholderOptionalKeys.length) {
      throw new Error(`Replace placeholder integration variables: ${[...new Set(placeholderOptionalKeys)].join(", ")}`);
    }
  }

  validateOptionalCallback("GOOGLE_CALLBACK_URL", ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"]);
  validateOptionalCallback("DISCORD_CALLBACK_URL", ["DISCORD_CLIENT_ID", "DISCORD_CLIENT_SECRET"]);
  validateOptionalCallback("STEAM_CALLBACK_URL", [], { alwaysActive: true });
  validateOptionalCallback("EPIC_CALLBACK_URL", ["EPIC_CLIENT_ID", "EPIC_CLIENT_SECRET"]);
  validateOptionalCallback("MICROSOFT_CALLBACK_URL", ["MICROSOFT_CLIENT_ID", "MICROSOFT_CLIENT_SECRET"]);

  if (present("STEAM_API_KEY") && !/^[a-f0-9]{32}$/i.test(valueFor("STEAM_API_KEY"))) {
    throw new Error("STEAM_API_KEY must be a 32-character Steam Web API key.");
  }
  ["DISCORD_GUILD_ID", "DISCORD_CATEGORY_ID"].filter(present).forEach((key) => {
    if (!/^\d{17,20}$/.test(valueFor(key))) throw new Error(`${key} must be a Discord snowflake ID.`);
  });
  if (isProduction() && present("TURNSTILE_SECRET_KEY")) {
    const hostnames = valueFor("TURNSTILE_ALLOWED_HOSTNAMES")
      .split(",")
      .map((hostname) => hostname.trim().toLowerCase())
      .filter(Boolean);
    if (!hostnames.length || hostnames.some((hostname) => !/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(hostname))) {
      throw new Error("TURNSTILE_ALLOWED_HOSTNAMES must list valid production hostnames when Turnstile is enabled.");
    }
  }
  assertBoundedInteger("OTP_TTL_MINUTES", 1, 60);
  assertBoundedInteger("OTP_RESEND_COOLDOWN_SECONDS", 15, 3600);
  assertBoundedInteger("OTP_MAX_ATTEMPTS", 1, 20);
  assertBoundedInteger("SMTP_PORT", 1, 65535);
  assertBoundedInteger("PORT", 1, 65535);
  assertBoundedInteger("LOCAL_PORT", 1, 65535);
  assertBoundedInteger("ANALYTICS_MAX_WORKERS", 1, 4);
  assertBoundedInteger("ANALYTICS_MAX_QUEUE", 1, 100);
  assertJwtLifetime();

  optionalIntegrations.forEach(([label, keys]) => {
    const missing = keys.filter((key) => !present(key));
    if (missing.length) {
      console.warn(`${label} disabled or partial: ${missing.join(", ")} missing.`);
    }
  });
};

export default validateEnv;
