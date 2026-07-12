import { isProductionRuntime } from "./runtimeEnv.js";

export const publicOperationalError = (error, fallback = "A background refresh will be retried later.") => {
  if (isProductionRuntime()) return fallback;
  return String(error?.message || fallback)
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200);
};
