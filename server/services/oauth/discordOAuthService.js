const DISCORD_AUTH_URL = "https://discord.com/oauth2/authorize";
const DISCORD_TOKEN_URL = "https://discord.com/api/oauth2/token";
const DISCORD_USER_URL = "https://discord.com/api/users/@me";

const requiredDiscordEnv = () => ["DISCORD_CLIENT_ID", "DISCORD_CLIENT_SECRET", "DISCORD_CALLBACK_URL"].every((key) => Boolean(process.env[key]));

const getDiscordAvatarUrl = (profile) => {
  if (!profile.avatar) return null;
  return `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png?size=128`;
};

export const isDiscordOAuthConfigured = requiredDiscordEnv;

export const buildDiscordAuthUrl = (state) => {
  const params = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID,
    redirect_uri: process.env.DISCORD_CALLBACK_URL,
    response_type: "code",
    scope: "identify email",
    state,
    prompt: "consent"
  });

  return `${DISCORD_AUTH_URL}?${params.toString()}`;
};

export const exchangeDiscordCodeForToken = async (code) => {
  const response = await fetch(DISCORD_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.DISCORD_CLIENT_ID,
      client_secret: process.env.DISCORD_CLIENT_SECRET,
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.DISCORD_CALLBACK_URL
    })
  });

  if (!response.ok) {
    throw new Error("Discord token exchange failed");
  }

  return response.json();
};

export const fetchDiscordProfile = async (accessToken) => {
  const response = await fetch(DISCORD_USER_URL, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!response.ok) {
    throw new Error("Discord profile fetch failed");
  }

  return response.json();
};

export const handleDiscordOAuthCallback = async (code) => {
  const tokens = await exchangeDiscordCodeForToken(code);
  const profile = await fetchDiscordProfile(tokens.access_token);

  return {
    id: profile.id,
    username: profile.username,
    globalName: profile.global_name,
    email: profile.email,
    avatar: getDiscordAvatarUrl(profile),
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    tokenExpiresAt: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : undefined,
    connectedAt: new Date()
  };
};
