const isProduction = () => process.env.NODE_ENV === "production";

const requiredProductionKeys = ["MONGO_URI", "JWT_SECRET", "CLIENT_URL", "SERVER_URL"];

const optionalIntegrations = [
  ["Google OAuth", ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"]],
  ["Discord OAuth", ["DISCORD_CLIENT_ID", "DISCORD_CLIENT_SECRET"]],
  ["Discord voice rooms", ["DISCORD_BOT_TOKEN", "DISCORD_GUILD_ID"]],
  ["Steam integration", ["STEAM_API_KEY"]],
  ["Epic Games OAuth", ["EPIC_CLIENT_ID", "EPIC_CLIENT_SECRET"]],
  ["Microsoft OAuth", ["MICROSOFT_CLIENT_ID", "MICROSOFT_CLIENT_SECRET"]]
];

const present = (key) => Boolean(String(process.env[key] || "").trim());

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
  }

  optionalIntegrations.forEach(([label, keys]) => {
    const missing = keys.filter((key) => !present(key));
    if (missing.length) {
      console.warn(`${label} disabled or partial: ${missing.join(", ")} missing.`);
    }
  });
};

export default validateEnv;
