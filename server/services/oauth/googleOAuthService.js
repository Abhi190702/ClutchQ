import { fetchWithTimeout } from "../../utils/fetchWithTimeout.js";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";

const requiredGoogleEnv = () => ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_CALLBACK_URL"].every((key) => Boolean(process.env[key]));

export const isGoogleOAuthConfigured = requiredGoogleEnv;

export const buildGoogleAuthUrl = (state) => {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: process.env.GOOGLE_CALLBACK_URL,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account"
  });

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
};

export const exchangeGoogleCodeForToken = async (code) => {
  const response = await fetchWithTimeout(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_CALLBACK_URL,
      grant_type: "authorization_code"
    })
  });

  if (!response.ok) {
    throw new Error("Google token exchange failed");
  }

  return response.json();
};

export const fetchGoogleProfile = async (accessToken) => {
  const response = await fetchWithTimeout(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!response.ok) {
    throw new Error("Google profile fetch failed");
  }

  return response.json();
};

export const handleGoogleOAuthCallback = async (code) => {
  const tokens = await exchangeGoogleCodeForToken(code);
  const profile = await fetchGoogleProfile(tokens.access_token);

  return {
    id: profile.sub,
    email: profile.email,
    emailVerified: Boolean(profile.email_verified),
    name: profile.name || profile.email?.split("@")[0] || "Google Player",
    avatar: profile.picture,
    connectedAt: new Date()
  };
};
