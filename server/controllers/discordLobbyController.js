import Lobby from "../models/Lobby.js";
import { asyncHandler } from "../middleware/errorMiddleware.js";
import { createOrReuseLobbyRoom, deleteDiscordChannel, DiscordServiceError } from "../services/discordService.js";
import {
  acquireDiscordProvisioningLease,
  persistDiscordProvision,
  releaseDiscordProvisioningLease
} from "../services/discordProvisioningService.js";

const getUserId = (value) => String(value?._id || value || "");

const isLobbyOwner = (lobby, userId) => getUserId(lobby.ownerId) === getUserId(userId);

const isLobbyMember = (lobby, userId) =>
  lobby.currentMembers?.some((member) => getUserId(member.userId) === getUserId(userId));

const canAccessDiscordRoom = (lobby, userId) => isLobbyOwner(lobby, userId) || isLobbyMember(lobby, userId);

const logDiscordControllerError = (action, error) => {
  console.error(`Discord lobby ${action} failed`, {
    message: error.message,
    statusCode: error.statusCode,
    details: error.details || error
  });
};

const sendDiscordError = (res, action, error) => {
  logDiscordControllerError(action, error);

  if (error instanceof DiscordServiceError) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
      requestId: res.req?.id
    });
  }

  return res.status(500).json({
    success: false,
    message: "Discord voice rooms are unavailable right now.",
    requestId: res.req?.id
  });
};

const findLobby = async (id, res) => {
  const lobby = await Lobby.findById(id);

  if (!lobby) {
    res.status(404).json({
      success: false,
      message: "Lobby not found"
    });
    return null;
  }

  return lobby;
};

const clearLobbyDiscordRoom = (lobby) => {
  lobby.discord = undefined;
  lobby.markModified("discord");
};

export const createLobbyDiscordRoom = asyncHandler(async (req, res) => {
  const lobby = await findLobby(req.params.id, res);
  if (!lobby) return;

  if (!isLobbyOwner(lobby, req.user._id)) {
    return res.status(403).json({
      success: false,
      message: "Only the lobby owner can create a Discord voice room."
    });
  }

  if (lobby.status === "closed") {
    return res.status(409).json({
      success: false,
      message: "Discord rooms cannot be created for closed lobbies."
    });
  }

  const guard = { ownerId: req.user._id, status: { $ne: "closed" } };
  let lease = null;
  let discord = null;
  let previousChannelId = null;
  try {
    lease = await acquireDiscordProvisioningLease({ model: Lobby, resourceId: lobby._id, guard });
    if (!lease) {
      return res.status(409).json({
        success: false,
        message: "This Discord voice room is already being prepared or the lobby has closed.",
        requestId: req.id
      });
    }
    previousChannelId = lease.resource.discord?.channelId;
    discord = await createOrReuseLobbyRoom(lease.resource);
    const persisted = await persistDiscordProvision({
      model: Lobby,
      resourceId: lobby._id,
      guard,
      token: lease.token,
      discord
    });
    if (!persisted) {
      if (discord.channelId && discord.channelId !== previousChannelId) {
        await deleteDiscordChannel(discord.channelId).catch(() => {});
      }
      await releaseDiscordProvisioningLease({ model: Lobby, resourceId: lobby._id, token: lease.token }).catch(() => {});
      return res.status(409).json({
        success: false,
        message: "The lobby changed before Discord setup finished. Try again.",
        requestId: req.id
      });
    }

    res.json({
      success: true,
      message: "Discord voice room ready.",
      data: { discord: persisted.discord }
    });
  } catch (error) {
    if (discord?.channelId && discord.channelId !== previousChannelId) {
      await deleteDiscordChannel(discord.channelId).catch(() => {});
    }
    if (lease?.token) {
      await releaseDiscordProvisioningLease({ model: Lobby, resourceId: lobby._id, token: lease.token }).catch(() => {});
    }
    sendDiscordError(res, "create", error);
  }
});

export const getLobbyDiscordRoom = asyncHandler(async (req, res) => {
  const lobby = await findLobby(req.params.id, res);
  if (!lobby) return;

  if (!canAccessDiscordRoom(lobby, req.user._id)) {
    return res.status(403).json({
      success: false,
      message: "Join this lobby to access the Discord voice room."
    });
  }

  if (!lobby.discord?.channelId || !lobby.discord?.inviteUrl) {
    return res.json({
      success: true,
      message: "No Discord room created yet.",
      data: { discord: null }
    });
  }

  res.json({
    success: true,
    message: "Discord voice room loaded.",
    data: { discord: lobby.discord }
  });
});

export const deleteLobbyDiscordRoom = asyncHandler(async (req, res) => {
  const lobby = await findLobby(req.params.id, res);
  if (!lobby) return;

  if (!isLobbyOwner(lobby, req.user._id)) {
    return res.status(403).json({
      success: false,
      message: "Only the lobby owner can delete this Discord voice room."
    });
  }

  try {
    if (lobby.discord?.channelId) {
      await deleteDiscordChannel(lobby.discord.channelId);
    }

    clearLobbyDiscordRoom(lobby);
    await lobby.save();

    res.json({
      success: true,
      message: "Discord voice room removed.",
      data: { discord: null }
    });
  } catch (error) {
    sendDiscordError(res, "delete", error);
  }
});
