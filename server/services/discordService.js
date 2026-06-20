const DISCORD_API_BASE = "https://discord.com/api/v10";
const INVITE_MAX_AGE_SECONDS = 24 * 60 * 60;

export class DiscordServiceError extends Error {
  constructor(message, statusCode = 400, details = null) {
    super(message);
    this.name = "DiscordServiceError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

export const ensureDiscordConfigured = () => {
  if (!process.env.DISCORD_BOT_TOKEN || !process.env.DISCORD_GUILD_ID) {
    throw new DiscordServiceError("Discord voice rooms are not configured yet.", 503);
  }
};

export const getDiscordHeaders = () => {
  ensureDiscordConfigured();

  return {
    Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
    "Content-Type": "application/json"
  };
};

export const sanitizeChannelName = (lobby) => {
  const shortId = String(lobby?._id || "").slice(-4) || "room";
  const source = lobby?.title || lobby?.game || "lobby";
  const cleaned = source
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  const base = `clutchq-${cleaned || "lobby"}`;
  const suffix = `-${shortId}`;
  const maxBaseLength = 80 - suffix.length;

  return `${base.slice(0, maxBaseLength).replace(/-$/g, "")}${suffix}`;
};

const readDiscordResponse = async (response) => {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
};

const logDiscordError = (context, response, body) => {
  console.error("Discord API error", {
    context,
    status: response.status,
    statusText: response.statusText,
    body
  });
};

const handleCreateChannelError = (response, body) => {
  if (response.status === 404) {
    throw new DiscordServiceError("Discord server could not be found.", 404, body);
  }

  if (response.status === 401 || response.status === 403) {
    throw new DiscordServiceError("Discord bot does not have permission to create voice rooms.", 403, body);
  }

  if (response.status === 400 && process.env.DISCORD_CATEGORY_ID) {
    throw new DiscordServiceError("Discord category is invalid or inaccessible.", 400, body);
  }

  throw new DiscordServiceError("Discord voice room could not be created.", 502, body);
};

const handleInviteError = (response, body) => {
  if (response.status === 401 || response.status === 403) {
    throw new DiscordServiceError("Discord bot does not have permission to create voice rooms.", 403, body);
  }

  throw new DiscordServiceError("Discord invite could not be created.", 502, body);
};

export const createLobbyVoiceChannel = async (lobby) => {
  const body = {
    name: sanitizeChannelName(lobby),
    type: 2
  };

  if (process.env.DISCORD_CATEGORY_ID) {
    body.parent_id = process.env.DISCORD_CATEGORY_ID;
  }

  const response = await fetch(`${DISCORD_API_BASE}/guilds/${process.env.DISCORD_GUILD_ID}/channels`, {
    method: "POST",
    headers: getDiscordHeaders(),
    body: JSON.stringify(body)
  });
  const data = await readDiscordResponse(response);

  if (!response.ok) {
    logDiscordError("create voice channel", response, data);
    handleCreateChannelError(response, data);
  }

  return {
    channelId: data.id,
    channelName: data.name
  };
};

export const createInviteForChannel = async (channelId) => {
  const response = await fetch(`${DISCORD_API_BASE}/channels/${channelId}/invites`, {
    method: "POST",
    headers: getDiscordHeaders(),
    body: JSON.stringify({
      max_age: INVITE_MAX_AGE_SECONDS,
      max_uses: 0,
      unique: true
    })
  });
  const data = await readDiscordResponse(response);

  if (!response.ok) {
    logDiscordError("create channel invite", response, data);
    handleInviteError(response, data);
  }

  return {
    inviteUrl: `https://discord.gg/${data.code}`,
    code: data.code,
    expiresAt: data.expires_at || new Date(Date.now() + INVITE_MAX_AGE_SECONDS * 1000).toISOString()
  };
};

export const deleteDiscordChannel = async (channelId) => {
  if (!channelId) return { success: true };

  const response = await fetch(`${DISCORD_API_BASE}/channels/${channelId}`, {
    method: "DELETE",
    headers: getDiscordHeaders()
  });

  if (response.status === 404) {
    return { success: true };
  }

  const data = await readDiscordResponse(response);

  if (!response.ok) {
    logDiscordError("delete voice channel", response, data);

    if (response.status === 401 || response.status === 403) {
      throw new DiscordServiceError("Discord bot does not have permission to create voice rooms.", 403, data);
    }

    throw new DiscordServiceError("Discord voice room could not be deleted.", 502, data);
  }

  return { success: true };
};

export const createOrReuseLobbyRoom = async (lobby) => {
  if (lobby?.discord?.channelId && lobby?.discord?.inviteUrl) {
    return {
      channelId: lobby.discord.channelId,
      channelName: lobby.discord.channelName,
      inviteUrl: lobby.discord.inviteUrl,
      createdAt: lobby.discord.createdAt,
      expiresAt: lobby.discord.expiresAt
    };
  }

  const channel = await createLobbyVoiceChannel(lobby);

  try {
    const invite = await createInviteForChannel(channel.channelId);

    return {
      ...channel,
      inviteUrl: invite.inviteUrl,
      createdAt: new Date(),
      expiresAt: invite.expiresAt ? new Date(invite.expiresAt) : undefined
    };
  } catch (error) {
    await deleteDiscordChannel(channel.channelId).catch((deleteError) => {
      console.error("Failed to clean up Discord channel after invite error", deleteError);
    });
    throw error;
  }
};
