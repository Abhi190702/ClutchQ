const isProduction = () => process.env.NODE_ENV === "production";

const requiredProductionKeys = ["MONGO_URI", "JWT_SECRET", "CLIENT_URL", "SERVER_URL"];
const placeholderValues = new Set([
  "replace_with_secure_secret",
  "your_long_secret",
  "your_mongodb_atlas_uri",
  "your-vercel-frontend-url",
  "..."
]);

const optionalIntegrations = [
  ["Google OAuth", ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"]],
  ["Discord OAuth", ["DISCORD_CLIENT_ID", "DISCORD_CLIENT_SECRET"]],
  ["Discord voice rooms", ["DISCORD_BOT_TOKEN", "DISCORD_GUILD_ID"]],
  ["Steam integration", ["STEAM_API_KEY"]],
  ["Epic Games OAuth", ["EPIC_CLIENT_ID", "EPIC_CLIENT_SECRET"]],
  ["Microsoft OAuth", ["MICROSOFT_CLIENT_ID", "MICROSOFT_CLIENT_SECRET"]],
  ["Cloudflare Turnstile", ["TURNSTILE_SECRET_KEY"]],
  ["OTP email SMTP", ["SMTP_HOST", "SMTP_USER", "SMTP_PASS"]]
];

const present = (key) => Boolean(String(process.env[key] || "").trim());
const valueFor = (key) => String(process.env[key] || "").trim();

const isPlaceholder = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  return !normalized || placeholderValues.has(normalized) || normalized.startsWith("your_");
};

const assertValidUrl = (key) => {
  const value = valueFor(key);
  try {
    const parsed = new URL(value);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw new Error("invalid protocol");
    }
  } catch {
    throw new Error(`${key} must be a valid http(s) URL.`);
  }
};

const assertProductionSecret = () => {
  const secret = valueFor("JWT_SECRET");
  if (isPlaceholder(secret) || secret.length < 32) {
    throw new Error("JWT_SECRET must be a real production secret with at least 32 characters.");
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
    assertValidUrl("CLIENT_URL");
    assertValidUrl("SERVER_URL");
  }

  optionalIntegrations.forEach(([label, keys]) => {
    const missing = keys.filter((key) => !present(key));
    if (missing.length) {
      console.warn(`${label} disabled or partial: ${missing.join(", ")} missing.`);
    }
  });
};

export default validateEnv;
