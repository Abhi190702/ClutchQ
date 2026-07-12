import { isProductionRuntime } from "../utils/runtimeEnv.js";

export const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

const normalizeError = (err, res) => {
  if (err instanceof SyntaxError && err.status === 400 && Object.hasOwn(err, "body")) {
    return { statusCode: 400, message: "Request body contains invalid JSON." };
  }

  if (err.name === "CastError") {
    const isIdentifier = err.path === "_id" || /Id$/.test(String(err.path || ""));
    return { statusCode: isIdentifier ? 404 : 400, message: isIdentifier ? "Resource not found" : "Invalid request data" };
  }

  if (err.name === "ValidationError") {
    const details = Object.values(err.errors || {})
      .map((error) => error.message)
      .filter(Boolean);
    return {
      statusCode: 400,
      message: details.length ? details.join(", ") : "Invalid request data"
    };
  }

  if (err.code === 11000) {
    return { statusCode: 409, message: "A record with those details already exists" };
  }

  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    return { statusCode: 401, message: "Session expired. Please log in again." };
  }

  const statusCode = err.statusCode || err.status || (res.statusCode === 200 ? 500 : res.statusCode);
  return {
    statusCode,
    message: err.message || "Server error. Please try again."
  };
};

export const errorHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);
  const { statusCode, message } = normalizeError(err, res);
  const isProduction = isProductionRuntime();
  const safeMessage = isProduction && statusCode >= 500 ? "Server error. Please try again." : message;

  if (statusCode >= 500) {
    if (isProduction) {
      console.error(`[${req.id || "no-request-id"}] ${req.method} ${req.originalUrl}`, {
        name: err.name || "Error",
        statusCode,
        message: err.message || "Server error"
      });
    } else {
      console.error(`[${req.id || "no-request-id"}] ${req.method} ${req.originalUrl}`, err);
    }
  }

  res.status(statusCode).json({
    success: false,
    message: safeMessage,
    requestId: req.id,
    ...(isProduction ? {} : { stack: err.stack })
  });
};

export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
