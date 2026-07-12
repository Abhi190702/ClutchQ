import crypto from "crypto";
import OAuthLoginCode from "../models/OAuthLoginCode.js";

const codeTtlMs = 2 * 60 * 1000;
const hashCode = (code) => crypto.createHash("sha256").update(String(code || "")).digest("hex");

export const createOAuthLoginCode = async (userId, { purpose = "login", provider, tokenVersion = 0 } = {}) => {
  if (!userId || !["login", "link"].includes(purpose) || (purpose === "link" && !["google", "discord", "steam"].includes(provider))) {
    throw new Error("Invalid OAuth handoff request.");
  }
  const code = crypto.randomBytes(32).toString("base64url");
  await OAuthLoginCode.create({
    userId,
    codeHash: hashCode(code),
    purpose,
    provider: purpose === "link" ? provider : undefined,
    tokenVersion: Math.max(0, Number(tokenVersion) || 0),
    expiresAt: new Date(Date.now() + codeTtlMs)
  });
  return code;
};

export const consumeOAuthLoginCode = async (code, { purpose = "login", provider } = {}) => {
  if (typeof code !== "string" || code.length < 32 || code.length > 128) return null;
  return OAuthLoginCode.findOneAndUpdate(
    {
      codeHash: hashCode(code),
      purpose,
      ...(provider ? { provider } : {}),
      consumedAt: null,
      expiresAt: { $gt: new Date() }
    },
    { $set: { consumedAt: new Date() } },
    { new: true }
  );
};
