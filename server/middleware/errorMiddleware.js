export const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

const normalizeError = (err, res) => {
  if (err.name === "CastError") {
    return { statusCode: 404, message: "Resource not found" };
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
  const { statusCode, message } = normalizeError(err, res);
  const isProduction = process.env.NODE_ENV === "production";
  const safeMessage = isProduction && statusCode >= 500 ? "Server error. Please try again." : message;

  if (statusCode >= 500) {
    console.error(`[${req.id || "no-request-id"}] ${req.method} ${req.originalUrl}`, err);
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
