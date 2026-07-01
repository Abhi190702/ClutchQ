const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export const verifyTurnstileToken = async (token, remoteIp) => {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  const isProduction = process.env.NODE_ENV === "production";

  if (!token) {
    return { success: false, errors: ["missing-input-response"], challengeTs: null, hostname: null };
  }

  if (!secret) {
    return {
      success: !isProduction,
      errors: isProduction ? ["missing-turnstile-secret"] : ["dev-bypass"],
      challengeTs: null,
      hostname: null
    };
  }

  try {
    const body = new URLSearchParams({
      secret,
      response: token
    });
    if (remoteIp) body.set("remoteip", remoteIp);

    const response = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body
    });
    const data = await response.json();

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
