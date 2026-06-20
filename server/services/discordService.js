const DISCORD_API_BASE = "https://discord.com/api/v10";
const INVITE_MAX_AGE_SECONDS = 24 * 60 * 60;
const CATEGORY_CHANNEL_TYPE = 4;
const ADMINISTRATOR_PERMISSION = 8n;
const ALL_REQUIRED_PERMISSIONS = [
  { label: "Create Invite", bit: 1n },
  { label: "Manage Channels", bit: 16n },
  { label: "View Channels", bit: 1024n },
  { label: "Connect", bit: 1048576n },
  { label: "Speak", bit: 2097152n }
];

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

const hasPermission = (permissions, bit) => (permissions & bit) === bit || (permissions & ADMINISTRATOR_PERMISSION) === ADMINISTRATOR_PERMISSION;

const getRolePermissions = (guild, roleIds = []) => {
  const roles = guild.roles || [];
  const roleIdSet = new Set([guild.id, ...roleIds]);

  return roles.reduce((permissions, role) => {
    if (!roleIdSet.has(role.id)) return permissions;
    return permissions | BigInt(role.permissions || 0);
  }, 0n);
};

const applyCategoryOverwrites = (permissions, guild, member, category) => {
  if (!category?.permission_overwrites?.length || hasPermission(permissions, ADMINISTRATOR_PERMISSION)) {
    return permissions;
  }

  let nextPermissions = permissions;
  const memberRoleIds = new Set(member.roles || []);
  const everyoneOverwrite = category.permission_overwrites.find((overwrite) => overwrite.id === guild.id && overwrite.type === 0);

  if (everyoneOverwrite) {
    nextPermissions &= ~BigInt(everyoneOverwrite.deny || 0);
    nextPermissions |= BigInt(everyoneOverwrite.allow || 0);
  }

  let roleAllows = 0n;
  let roleDenies = 0n;

  category.permission_overwrites.forEach((overwrite) => {
    if (overwrite.type !== 0 || !memberRoleIds.has(overwrite.id)) return;
    roleAllows |= BigInt(overwrite.allow || 0);
    roleDenies |= BigInt(overwrite.deny || 0);
  });

  nextPermissions &= ~roleDenies;
  nextPermissions |= roleAllows;

  const memberOverwrite = category.permission_overwrites.find((overwrite) => overwrite.id === member.user?.id && overwrite.type === 1);

  if (memberOverwrite) {
    nextPermissions &= ~BigInt(memberOverwrite.deny || 0);
    nextPermissions |= BigInt(memberOverwrite.allow || 0);
  }

  return nextPermissions;
};

const runDiscordRequest = async (path) => {
  const response = await fetch(`${DISCORD_API_BASE}${path}`, {
    headers: getDiscordHeaders()
  });
  const data = await readDiscordResponse(response);

  return {
    ok: response.ok,
    status: response.status,
    data
  };
};

const logDiscordError = (context, response, body) => {
  console.error("Discord API error", {
    context,
    status: response.status,
    statusText: response.statusText,
    body
  });
};

export const checkDiscordSetup = async () => {
  const checks = [];
  const addCheck = (key, success, message) => {
    checks.push({ key, success, message });
  };

  addCheck(
    "botToken",
    Boolean(process.env.DISCORD_BOT_TOKEN),
    process.env.DISCORD_BOT_TOKEN ? "Discord bot token is present." : "Discord voice rooms are not configured yet."
  );
  addCheck(
    "guildId",
    Boolean(process.env.DISCORD_GUILD_ID),
    process.env.DISCORD_GUILD_ID ? "Discord guild ID is present." : "Discord voice rooms are not configured yet."
  );
  addCheck(
    "categoryId",
    Boolean(process.env.DISCORD_CATEGORY_ID),
    process.env.DISCORD_CATEGORY_ID ? "Discord category ID is present." : "Discord category is not set; voice channels will be created at server root."
  );

  if (!process.env.DISCORD_BOT_TOKEN || !process.env.DISCORD_GUILD_ID) {
    return {
      success: false,
      checks
    };
  }

  try {
    const botResponse = await runDiscordRequest("/users/@me");
    addCheck(
      "botAccess",
      botResponse.ok,
      botResponse.ok ? "Discord bot token is valid." : "Discord bot token is invalid or expired."
    );

    if (!botResponse.ok) {
      return { success: false, checks };
    }

    const guildResponse = await runDiscordRequest(`/guilds/${process.env.DISCORD_GUILD_ID}`);
    addCheck(
      "guildAccess",
      guildResponse.ok,
      guildResponse.ok ? "Bot can access the configured Discord server." : "Discord server could not be found."
    );

    if (!guildResponse.ok) {
      return { success: false, checks };
    }

    let category = null;
    if (process.env.DISCORD_CATEGORY_ID) {
      const categoryResponse = await runDiscordRequest(`/channels/${process.env.DISCORD_CATEGORY_ID}`);
      const categoryAccessible = categoryResponse.ok;
      const categoryIsCategory = categoryAccessible && categoryResponse.data?.type === CATEGORY_CHANNEL_TYPE;
      category = categoryIsCategory ? categoryResponse.data : null;

      addCheck(
        "categoryAccess",
        categoryAccessible,
        categoryAccessible ? "Discord category is accessible." : "Discord category is invalid or inaccessible."
      );
      addCheck(
        "categoryType",
        categoryIsCategory,
        categoryIsCategory ? "Configured Discord channel is a category." : "Discord category is invalid; this ID is not a category."
      );
    }

    const memberResponse = await runDiscordRequest(`/guilds/${process.env.DISCORD_GUILD_ID}/members/${botResponse.data.id}`);
    addCheck(
      "botMember",
      memberResponse.ok,
      memberResponse.ok ? "Bot membership in the Discord server is confirmed." : "Bot membership could not be verified."
    );

    if (!memberResponse.ok) {
      return { success: false, checks };
    }

    const basePermissions = getRolePermissions(guildResponse.data, memberResponse.data.roles);
    const effectivePermissions = category
      ? applyCategoryOverwrites(basePermissions, guildResponse.data, memberResponse.data, category)
      : basePermissions;
    const missingPermissions = ALL_REQUIRED_PERMISSIONS
      .filter((permission) => !hasPermission(effectivePermissions, permission.bit))
      .map((permission) => permission.label);

    addCheck(
      "permissions",
      missingPermissions.length === 0,
      missingPermissions.length
        ? `Discord bot does not have permission: ${missingPermissions.join(", ")}.`
        : "Discord bot has the required voice room permissions."
    );
  } catch (error) {
    console.error("Discord setup health check failed", error);
    addCheck("healthRequest", false, "Discord setup check could not reach Discord.");
  }

  return {
    success: checks.every((check) => check.success),
    checks
  };
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
