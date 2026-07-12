import crypto from "node:crypto";

const requestIdPattern = /^[A-Za-z0-9._:-]{1,100}$/;

export const createRequestId = (incomingValue) => {
  const incoming = String(incomingValue || "").trim();
  return requestIdPattern.test(incoming) ? incoming : crypto.randomUUID();
};

export const publicDatabaseHealth = (connection, isProduction = false) => {
  const states = ["disconnected", "connected", "connecting", "disconnecting"];
  const state = states[connection?.readyState] || "unknown";

  return {
    state,
    ...(!isProduction
      ? {
          host: connection?.host || null,
          name: connection?.name || null
        }
      : {})
  };
};

const hasUnsafeObjectKey = (value, depth = 0) => {
  if (!value || typeof value !== "object") return false;
  if (depth > 12) return true;
  if (Array.isArray(value)) return value.some((item) => hasUnsafeObjectKey(item, depth + 1));

  return Object.entries(value).some(
    ([key, item]) =>
      key.startsWith("$") ||
      key.includes(".") ||
      ["__proto__", "prototype", "constructor"].includes(key) ||
      hasUnsafeObjectKey(item, depth + 1)
  );
};

export const validateRequestBody = (req, res, next) => {
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method) || req.body === undefined) return next();
  if (req.body === null || Array.isArray(req.body) || typeof req.body !== "object") {
    res.status(400);
    return next(new Error("Request body must be a JSON object."));
  }
  if (hasUnsafeObjectKey(req.body)) {
    res.status(400);
    return next(new Error("Request body contains an unsupported field name."));
  }
  return next();
};
