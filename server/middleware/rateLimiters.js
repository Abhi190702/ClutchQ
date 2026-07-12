import rateLimit from "express-rate-limit";

const genericLimitMessage = {
  success: false,
  message: "Too many attempts. Try again later."
};

const createLimiter = ({ windowMs, limit }) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    message: genericLimitMessage
  });

export const publicLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 300
});

export const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 50
});

export const registrationLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  limit: 10
});

export const loginLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 10
});

export const otpRequestLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 5
});

export const otpVerifyLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 10
});

export const passwordResetLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  limit: 5
});

export const scorecardUploadLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 20
});

export const analyticsRebuildLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 10
});

export const steamSyncLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 5
});

export const externalMetadataLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 30
});

export const reportLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  limit: 10
});
