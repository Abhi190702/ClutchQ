import crypto from "crypto";
import PasswordResetSession from "../models/PasswordResetSession.js";
import { getJwtSecret } from "../utils/validateEnv.js";

const DEFAULT_TTL_MINUTES = 10;

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();
const ttlMinutes = () => {
  const value = Number.parseInt(process.env.OTP_TTL_MINUTES || "", 10);
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_TTL_MINUTES;
};

const hashResetToken = (resetToken) =>
  crypto.createHmac("sha256", getJwtSecret()).update(String(resetToken || "")).digest("hex");

export const invalidatePasswordResetSessions = async (email) => {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return;
  await PasswordResetSession.updateMany(
    { email: normalizedEmail, consumedAt: null },
    { $set: { consumedAt: new Date() } }
  );
};

export const createPasswordResetSession = async ({ email, ip, userAgent }) => {
  const normalizedEmail = normalizeEmail(email);
  const resetToken = crypto.randomBytes(32).toString("hex");

  await invalidatePasswordResetSessions(normalizedEmail);

  await PasswordResetSession.create({
    email: normalizedEmail,
    tokenHash: hashResetToken(resetToken),
    expiresAt: new Date(Date.now() + ttlMinutes() * 60 * 1000),
    requestIp: String(ip || "").slice(0, 100),
    userAgent: String(userAgent || "").slice(0, 500)
  });

  return { resetToken };
};

export const verifyPasswordResetSession = async (resetToken) => {
  if (!resetToken || typeof resetToken !== "string" || resetToken.length > 128) return { success: false, session: null };

  const session = await PasswordResetSession.findOne({
    tokenHash: hashResetToken(resetToken),
    consumedAt: null,
    expiresAt: { $gt: new Date() }
  });

  return { success: Boolean(session), session };
};

export const consumePasswordResetSession = async (resetToken) => {
  if (!resetToken || typeof resetToken !== "string" || resetToken.length > 128) return { success: false, session: null };

  const session = await PasswordResetSession.findOneAndUpdate(
    {
      tokenHash: hashResetToken(resetToken),
      consumedAt: null,
      expiresAt: { $gt: new Date() }
    },
    { $set: { consumedAt: new Date() } },
    { new: true }
  );

  return { success: Boolean(session), session };
};
