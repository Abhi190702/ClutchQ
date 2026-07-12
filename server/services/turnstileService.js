import { fetchWithTimeout } from "../utils/fetchWithTimeout.js";
import { isProductionRuntime } from "../utils/runtimeEnv.js";
import { getTurnstileAllowedHostnames } from "../utils/turnstileConfig.js";

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export const verifyTurnstileToken = async (token, remoteIp) => {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  const isProduction = isProductionRuntime();

  if (!secret) {
    return {
      success: !isProduction,
      errors: isProduction ? ["missing-turnstile-secret"] : ["dev-bypass"],
      challengeTs: null,
      hostname: null
    };
  }

  if (!token || typeof token !== "string" || token.length > 2048) {
    return { success: false, errors: ["missing-input-response"], challengeTs: null, hostname: null };
  }

  try {
    const body = new URLSearchParams({
      secret,
      response: token
    });
    if (remoteIp) body.set("remoteip", remoteIp);

    const response = await fetchWithTimeout(VERIFY_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body
    });
    if (!response.ok) {
      return { success: false, errors: ["turnstile_unavailable"], challengeTs: null, hostname: null };
    }
    const data = await response.json();

    const configuredHostnames = getTurnstileAllowedHostnames();
    if (isProduction && configuredHostnames.length && !configuredHostnames.includes(String(data.hostname || "").toLowerCase())) {
      return { success: false, errors: ["hostname-mismatch"], challengeTs: data.challenge_ts || null, hostname: data.hostname || null };
    }

    return {
      success: Boolean(data.success),
      errors: Array.isArray(data["error-codes"]) ? data["error-codes"] : [],
      challengeTs: data.challenge_ts || null,
      hostname: data.hostname || null
    };
  } catch {
    return { success: false, errors: ["turnstile_unavailable"], challengeTs: null, hostname: null };
  }
};
