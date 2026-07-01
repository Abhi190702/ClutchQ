import crypto from "crypto";
import OtpToken from "../models/OtpToken.js";
import { getJwtSecret } from "../utils/validateEnv.js";

const DEFAULT_TTL_MINUTES = 10;
const DEFAULT_RESEND_SECONDS = 60;
const DEFAULT_MAX_ATTEMPTS = 5;

const toPositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

export const generateOtp = () => String(crypto.randomInt(100000, 1000000));

export const hashOtp = (email, purpose, otp) =>
  crypto.createHmac("sha256", getJwtSecret()).update(`${normalizeEmail(email)}:${purpose}:${otp}`).digest("hex");

export const verifyOtpHash = (email, purpose, otp, hash) => {
  if (!hash || !/^\d{6}$/.test(String(otp || ""))) return false;
  const expected = hashOtp(email, purpose, otp);
  const expectedBuffer = Buffer.from(expected, "hex");
  const actualBuffer = Buffer.from(hash, "hex");
  return expectedBuffer.length === actualBuffer.length && crypto.timingSafeEqual(expectedBuffer, actualBuffer);
};

export const invalidateOtps = async (email, purpose) => {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || !purpose) return;
  await OtpToken.updateMany(
    { email: normalizedEmail, purpose, consumedAt: null },
    { $set: { consumedAt: new Date() } }
  );
};

export const createOtp = async ({ email, purpose, ip, userAgent }) => {
  const normalizedEmail = normalizeEmail(email);
  const otp = generateOtp();
  const ttlMinutes = toPositiveInt(process.env.OTP_TTL_MINUTES, DEFAULT_TTL_MINUTES);
  const resendSeconds = toPositiveInt(process.env.OTP_RESEND_COOLDOWN_SECONDS, DEFAULT_RESEND_SECONDS);
  const maxAttempts = toPositiveInt(process.env.OTP_MAX_ATTEMPTS, DEFAULT_MAX_ATTEMPTS);
  const activeToken = await OtpToken.findOne({
    email: normalizedEmail,
    purpose,
    consumedAt: null,
    expiresAt: { $gt: new Date() }
  }).sort({ createdAt: -1 });

  if (activeToken?.resendAvailableAt && activeToken.resendAvailableAt > new Date()) {
    return {
      cooldown: true,
      retryAfterSeconds: Math.ceil((activeToken.resendAvailableAt.getTime() - Date.now()) / 1000),
      ttlMinutes,
      resendSeconds
    };
  }

  await invalidateOtps(normalizedEmail, purpose);

  const token = await OtpToken.create({
    email: normalizedEmail,
    purpose,
    otpHash: hashOtp(normalizedEmail, purpose, otp),
    maxAttempts,
    expiresAt: new Date(Date.now() + ttlMinutes * 60 * 1000),
    resendAvailableAt: new Date(Date.now() + resendSeconds * 1000),
    requestIp: ip,
    userAgent
  });

  return { token, otp, ttlMinutes, resendSeconds };
};

export const verifyOtp = async ({ email, purpose, otp }) => {
  const normalizedEmail = normalizeEmail(email);
  const cleanOtp = String(otp || "").trim();

  if (!normalizedEmail || !purpose || !/^\d{6}$/.test(cleanOtp)) {
    return { success: false, reason: "invalid" };
  }

  const token = await OtpToken.findOne({
    email: normalizedEmail,
    purpose,
    consumedAt: null,
    expiresAt: { $gt: new Date() }
  }).sort({ createdAt: -1 });

  if (!token) return { success: false, reason: "expired" };
  if (token.attempts >= token.maxAttempts) return { success: false, reason: "locked" };

  if (!verifyOtpHash(normalizedEmail, purpose, cleanOtp, token.otpHash)) {
    token.attempts += 1;
    await token.save();
    return { success: false, reason: token.attempts >= token.maxAttempts ? "locked" : "invalid" };
  }

  token.consumedAt = new Date();
  await token.save();
  return { success: true, token };
};

export const consumeOtp = async (token) => {
  if (!token) return null;
  token.consumedAt = token.consumedAt || new Date();
  return token.save();
};
