import Game from "../models/Game.js";
import GameRoom from "../models/GameRoom.js";
import GamerProfile from "../models/GamerProfile.js";
import User from "../models/User.js";
import { asyncHandler } from "../middleware/errorMiddleware.js";
import { createOrReuseLobbyRoom, deleteDiscordChannel, DiscordServiceError } from "../services/discordService.js";
import {
  acquireDiscordProvisioningLease,
  persistDiscordProvision,
  releaseDiscordProvisioningLease
} from "../services/discordProvisioningService.js";
import { sanitizeRoomForViewer } from "../utils/roomPrivacy.js";
import { boundedSlug } from "../utils/queryInput.js";
import { booleanInput, cleanTextInput, dateInput, numberInput } from "../utils/inputValue.js";
import { isSharedDemoUser } from "../utils/demoAccounts.js";

const getId = (value) => String(value?._id || value || "");
const isRoomHost = (room, userId) => getId(room.hostId) === getId(userId);
const isRoomMember = (room, userId) => room.currentMembers?.some((member) => getId(member.userId) === getId(userId) && member.status !== "left");
const cleanText = cleanTextInput;
const cleanList = (value, maxItems, maxLength = 50) =>
  Array.isArray(value) ? [...new Set(value.map((item) => cleanText(item, maxLength)).filter(Boolean))].slice(0, maxItems) : [];
const terminalRoomStatuses = new Set(["completed", "cancelled"]);
const statusTransitions = {
  open: new Set(["starting", "cancelled"]),
  full: new Set(["open", "starting", "cancelled"]),
  starting: new Set(["in_game", "cancelled"]),
  in_game: new Set(["completed", "cancelled"]),
  completed: new Set(),
  cancelled: new Set()
};

const cleanupDiscordRoom = async (room, requestId) => {
  const warnings = [];
  const channelId = room.discord?.channelId;
  if (!channelId) return warnings;

  try {
    await deleteDiscordChannel(channelId);
    await GameRoom.updateOne(
      { _id: room._id, status: { $in: [...terminalRoomStatuses] }, "discord.channelId": channelId },
      { $unset: { discord: "" } }
    );
    room.discord = undefined;
  } catch (error) {
    warnings.push("The game room closed, but its Discord voice cleanup will be retried.");
    console.error(`[${requestId || "no-request-id"}] Game room Discord cleanup failed:`, error.message);
  }
  return warnings;
};

const parseRoomDate = (value) => {
  if (value === undefined || value === null || value === "") return undefined;
  const date = dateInput(value);
  if (!date) {
    const error = new Error("Enter a valid room start time.");
    error.statusCode = 400;
    throw error;
  }
  const serverNow = Date.now();
  if (date.getTime() < serverNow - 5 * 60 * 1000) {
    const error = new Error("Room start time cannot be in the past.");
    error.statusCode = 400;
    throw error;
  }
  if (date.getTime() > serverNow + 90 * 24 * 60 * 60 * 1000) {
    const error = new Error("Room start time must be within the next 90 days.");
    error.statusCode = 400;
    throw error;
  }
  return date;
};

const getRoom = async (id) =>
  GameRoom.findById(id)
    .populate({ path: "hostId", select: "name avatar", match: { isSuspended: { $ne: true } } })
    .populate({ path: "currentMembers.userId", select: "name avatar", match: { isSuspended: { $ne: true } } });
const getRoomForViewer = async (id, userId) => sanitizeRoomForViewer(await getRoom(id), userId);

export const createGameRoom = asyncHandler(async (req, res) => {
  const {
    gameSlug,
    title,
    mode,
    region,
    language,
    rankMin,
    rankMax,
    micRequired,
    maxMembers,
    neededRoles,
    tags,
    startsAt
  } = req.body;

  const cleanGameSlug = boundedSlug(gameSlug);
  const cleanRegion = cleanText(region, 80);
  const cleanLanguage = cleanText(language, 40);
  if (!cleanGameSlug || !title || !cleanRegion || !cleanLanguage) {
    res.status(400);
    throw new Error("Game, room title, region, and language are required");
  }

  const cleanTitle = cleanText(title, 80);
  if (!cleanTitle) {
    res.status(400);
    throw new Error("Room title is required");
  }

  const game = await Game.findOne({ slug: cleanGameSlug, active: true });
  if (!game) {
    res.status(404);
    throw new Error("Game not found");
  }

  const requestedMemberLimit =
    maxMembers === undefined || maxMembers === "" ? Number(game.teamSize) || 5 : numberInput(maxMembers);
  if (requestedMemberLimit === undefined || !Number.isInteger(requestedMemberLimit) || requestedMemberLimit < 2 || requestedMemberLimit > 10) {
    res.status(400);
    throw new Error("Room capacity must be a number between 2 and 10.");
  }
  const memberLimit = requestedMemberLimit;
  const requestedTrust = numberInput(req.body.trustRequirement);
  if (
    req.body.trustRequirement !== undefined &&
    req.body.trustRequirement !== "" &&
    (requestedTrust === undefined || requestedTrust < 0 || requestedTrust > 100)
  ) {
    res.status(400);
    throw new Error("Trust requirement must be a number between 0 and 100.");
  }
  const trustRequirement = requestedTrust !== undefined ? Math.round(requestedTrust) : 60;
  const requestedRoles = cleanList(neededRoles, memberLimit);

  const room = await GameRoom.create({
    gameId: game._id,
    gameSlug: cleanGameSlug,
    title: cleanTitle,
    hostId: req.user._id,
    mode: cleanText(mode || game.supportedModes?.[0] || "Open Lobby", 60),
    region: cleanRegion,
    language: cleanLanguage,
    rankMin: cleanText(rankMin, 50),
    rankMax: cleanText(rankMax, 50),
    micRequired: booleanInput(micRequired),
    maxMembers: memberLimit,
    currentMembers: [{ userId: req.user._id, role: requestedRoles[0] || game.roles?.[0] || "Flex", ready: false }],
    neededRoles: requestedRoles.length ? requestedRoles : game.roles?.slice(0, 3) || [],
    tags: cleanList(tags, 8, 40),
    trustRequirement,
    startsAt: parseRoomDate(startsAt)
  });

  res.status(201).json({
    success: true,
    message: "Game room created",
    data: await getRoomForViewer(room._id, req.user._id)
  });
});

export const getGameRoom = asyncHandler(async (req, res) => {
  const room = await getRoom(req.params.id);
  if (!room || !room.hostId) {
    res.status(404);
    throw new Error("Game room not found");
  }

  res.json({
    success: true,
    message: "Game room loaded",
    data: sanitizeRoomForViewer(room, req.user._id)
  });
});

export const joinGameRoom = asyncHandler(async (req, res) => {
  const room = await GameRoom.findById(req.params.id);
  if (!room) {
    res.status(404);
    throw new Error("Game room not found");
  }

  if (isRoomMember(room, req.user._id)) {
    return res.json({
      success: true,
      message: "You are already in this room",
      data: await getRoomForViewer(room._id, req.user._id)
    });
  }

  const [activeHost, profile] = await Promise.all([
    User.findOne({ _id: room.hostId, isSuspended: { $ne: true } }).select("email"),
    GamerProfile.findOne({ userId: req.user._id }).select("trustScore")
  ]);
  if (!activeHost) {
    res.status(409);
    throw new Error("This room is no longer available.");
  }
  if (isSharedDemoUser(req.user) && !isSharedDemoUser(activeHost)) {
    res.status(403);
    throw new Error("Shared demo accounts can only join rooms hosted by seeded demo players.");
  }
  if (!profile) {
    res.status(400);
    throw new Error("Complete your gamer profile before joining a room.");
  }
  if ((Number(profile.trustScore) || 0) < (Number(room.trustRequirement) || 0)) {
    res.status(403);
    throw new Error(`This room requires a trust score of ${room.trustRequirement}.`);
  }

  const updated = await GameRoom.findOneAndUpdate(
    {
      _id: room._id,
      status: "open",
      "currentMembers.userId": { $ne: req.user._id },
      $expr: {
        $lt: [
          {
            $size: {
              $filter: {
                input: { $ifNull: ["$currentMembers", []] },
                as: "member",
                cond: { $ne: ["$$member.status", "left"] }
              }
            }
          },
          "$maxMembers"
        ]
      }
    },
    {
      $push: {
        currentMembers: {
          userId: req.user._id,
          role: cleanText(req.body.role || room.neededRoles?.[0] || "Flex", 50),
          ready: false,
          status: "joined"
        }
      }
    },
    { new: true, runValidators: true }
  );

  if (!updated) {
    res.status(409);
    throw new Error(room.status === "open" ? "This room is full" : "This room is not open for joining");
  }

  const activeMembers = updated.currentMembers?.filter((member) => member.status !== "left").length || 0;
  if (activeMembers >= updated.maxMembers) {
    await GameRoom.updateOne({ _id: updated._id, status: "open" }, { $set: { status: "full" } });
  }

  res.json({
    success: true,
    message: "Joined game room",
    data: await getRoomForViewer(updated._id, req.user._id)
  });
});

export const leaveGameRoom = asyncHandler(async (req, res) => {
  const room = await GameRoom.findById(req.params.id);
  if (!room) {
    res.status(404);
    throw new Error("Game room not found");
  }

  if (isRoomHost(room, req.user._id)) {
    res.status(400);
    throw new Error("Room host can cancel the room instead of leaving");
  }

  if (!isRoomMember(room, req.user._id)) {
    res.status(403);
    throw new Error("Only room members can leave this room");
  }

  if (!["open", "full", "starting"].includes(room.status)) {
    res.status(409);
    throw new Error("Players cannot leave after the room has entered a match.");
  }

  const updated = await GameRoom.findOneAndUpdate(
    {
      _id: room._id,
      status: { $in: ["open", "full", "starting"] },
      "currentMembers.userId": req.user._id
    },
    { $pull: { currentMembers: { userId: req.user._id } } },
    { new: true, runValidators: true }
  );
  if (!updated) {
    res.status(409);
    throw new Error("The room changed before you could leave. Refresh and try again.");
  }
  if (updated.status === "full") {
    await GameRoom.updateOne({ _id: updated._id, status: "full" }, { $set: { status: "open" } });
  }

  res.json({
    success: true,
    message: "Left game room",
    data: await getRoomForViewer(updated._id, req.user._id)
  });
});

export const updateGameRoomReady = asyncHandler(async (req, res) => {
  const room = await GameRoom.findById(req.params.id);
  if (!room) {
    res.status(404);
    throw new Error("Game room not found");
  }

  if (!["open", "full", "starting"].includes(room.status)) {
    res.status(409);
    throw new Error("Ready state cannot be changed after the room has started.");
  }

  const ready = booleanInput(req.body.ready);
  const updated = await GameRoom.findOneAndUpdate(
    {
      _id: room._id,
      status: { $in: ["open", "full", "starting"] },
      "currentMembers.userId": req.user._id
    },
    { $set: { "currentMembers.$.ready": ready } },
    { new: true }
  );
  if (!updated) {
    const stillMutable = await GameRoom.exists({ _id: room._id, status: { $in: ["open", "full", "starting"] } });
    res.status(stillMutable ? 403 : 409);
    throw new Error(stillMutable ? "Only room members can update ready state" : "Ready state cannot be changed after the room has started.");
  }

  res.json({
    success: true,
    message: ready ? "Marked ready" : "Marked not ready",
    data: await getRoomForViewer(updated._id, req.user._id)
  });
});

export const updateGameRoom = asyncHandler(async (req, res) => {
  const room = await GameRoom.findById(req.params.id);
  if (!room) {
    res.status(404);
    throw new Error("Game room not found");
  }

  if (!isRoomHost(room, req.user._id)) {
    res.status(403);
    throw new Error("Only the room host can update this room");
  }

  if (terminalRoomStatuses.has(room.status)) {
    res.status(409);
    throw new Error("Completed or cancelled rooms cannot be edited.");
  }

  const warnings = [];
  if (req.body.title !== undefined) {
    const title = cleanText(req.body.title, 80);
    if (!title) {
      res.status(400);
      throw new Error("Room title cannot be empty.");
    }
    room.title = title;
  }
  if (req.body.mode !== undefined) room.mode = cleanText(req.body.mode, 60);
  if (req.body.region !== undefined) {
    const region = cleanText(req.body.region, 80);
    if (!region) {
      res.status(400);
      throw new Error("Room region cannot be empty.");
    }
    room.region = region;
  }
  if (req.body.language !== undefined) {
    const language = cleanText(req.body.language, 40);
    if (!language) {
      res.status(400);
      throw new Error("Room language cannot be empty.");
    }
    room.language = language;
  }
  if (req.body.rankMin !== undefined) room.rankMin = cleanText(req.body.rankMin, 50);
  if (req.body.rankMax !== undefined) room.rankMax = cleanText(req.body.rankMax, 50);
  if (req.body.micRequired !== undefined) room.micRequired = booleanInput(req.body.micRequired);
  if (req.body.neededRoles !== undefined) room.neededRoles = cleanList(req.body.neededRoles, 10);
  if (req.body.tags !== undefined) room.tags = cleanList(req.body.tags, 8, 40);
  if (req.body.startsAt !== undefined) room.startsAt = parseRoomDate(req.body.startsAt);
  if (req.body.status !== undefined) {
    const nextStatus = cleanText(req.body.status, 20);
    if (nextStatus !== room.status && !statusTransitions[room.status]?.has(nextStatus)) {
      res.status(409);
      throw new Error(`Room cannot move from ${room.status} to ${nextStatus || "an empty status"}.`);
    }
    room.status = nextStatus;
  }

  if (req.body.maxMembers !== undefined) {
    const activeMembers = room.currentMembers?.filter((member) => member.status !== "left").length || 0;
    const requestedMax = numberInput(req.body.maxMembers);
    if (requestedMax === undefined || !Number.isInteger(requestedMax) || requestedMax < 2 || requestedMax > 10) {
      res.status(400);
      throw new Error("Room capacity must be a whole number between 2 and 10.");
    }
    if (requestedMax < activeMembers) {
      res.status(400);
      throw new Error("Room capacity cannot be lower than its current member count.");
    }
    room.maxMembers = requestedMax;
    if (room.status === "open" && activeMembers >= room.maxMembers) room.status = "full";
    if (room.status === "full" && activeMembers < room.maxMembers) room.status = "open";
  }

  await room.save();
  if (terminalRoomStatuses.has(room.status)) {
    warnings.push(...(await cleanupDiscordRoom(room, req.id)));
  }

  res.json({
    success: true,
    message: "Game room updated",
    data: await getRoomForViewer(room._id, req.user._id),
    warnings
  });
});

export const deleteGameRoom = asyncHandler(async (req, res) => {
  const room = await GameRoom.findById(req.params.id);
  if (!room) {
    res.status(404);
    throw new Error("Game room not found");
  }

  if (!isRoomHost(room, req.user._id)) {
    res.status(403);
    throw new Error("Only the room host can cancel this room");
  }

  if (room.status === "completed") {
    res.status(409);
    throw new Error("Completed rooms cannot be cancelled.");
  }
  if (room.status === "cancelled") {
    const warnings = await cleanupDiscordRoom(room, req.id);
    return res.json({
      success: true,
      message: "Game room is already cancelled",
      data: sanitizeRoomForViewer(room, req.user._id),
      warnings
    });
  }

  room.status = "cancelled";
  await room.save();
  const warnings = await cleanupDiscordRoom(room, req.id);

  res.json({
    success: true,
    message: "Game room cancelled",
    data: sanitizeRoomForViewer(room, req.user._id),
    warnings
  });
});

const sendDiscordRoomError = (res, error) => {
  if (error instanceof DiscordServiceError) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message, requestId: res.req?.id });
  }

  return res.status(500).json({
    success: false,
    message: "Discord voice rooms are unavailable right now.",
    requestId: res.req?.id
  });
};

export const createGameRoomDiscord = asyncHandler(async (req, res) => {
  const room = await GameRoom.findById(req.params.id);
  if (!room) {
    res.status(404);
    throw new Error("Game room not found");
  }

  if (!isRoomHost(room, req.user._id)) {
    res.status(403);
    throw new Error("Only the room host can create a Discord voice room");
  }

  if (terminalRoomStatuses.has(room.status)) {
    res.status(409);
    throw new Error("Discord rooms cannot be created for completed or cancelled game rooms.");
  }

  const guard = { hostId: req.user._id, status: { $nin: [...terminalRoomStatuses] } };
  let lease = null;
  let discord = null;
  let previousChannelId = null;
  try {
    lease = await acquireDiscordProvisioningLease({ model: GameRoom, resourceId: room._id, guard });
    if (!lease) {
      return res.status(409).json({
        success: false,
        message: "This Discord voice room is already being prepared or the game room has closed.",
        requestId: req.id
      });
    }
    previousChannelId = lease.resource.discord?.channelId;
    discord = await createOrReuseLobbyRoom({
      _id: lease.resource._id,
      title: lease.resource.title,
      discord: lease.resource.discord
    });
    const persisted = await persistDiscordProvision({
      model: GameRoom,
      resourceId: room._id,
      guard,
      token: lease.token,
      discord
    });
    if (!persisted) {
      if (discord.channelId && discord.channelId !== previousChannelId) {
        await deleteDiscordChannel(discord.channelId).catch(() => {});
      }
      await releaseDiscordProvisioningLease({ model: GameRoom, resourceId: room._id, token: lease.token }).catch(() => {});
      return res.status(409).json({
        success: false,
        message: "The game room changed before Discord setup finished. Try again.",
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
      await releaseDiscordProvisioningLease({ model: GameRoom, resourceId: room._id, token: lease.token }).catch(() => {});
    }
    sendDiscordRoomError(res, error);
  }
});

export const getGameRoomDiscord = asyncHandler(async (req, res) => {
  const room = await GameRoom.findById(req.params.id);
  if (!room) {
    res.status(404);
    throw new Error("Game room not found");
  }

  if (!isRoomHost(room, req.user._id) && !isRoomMember(room, req.user._id)) {
    res.status(403);
    throw new Error("Join this room to access the Discord voice room.");
  }

  res.json({
    success: true,
    message: room.discord?.inviteUrl ? "Discord voice room loaded." : "No Discord room created yet.",
    data: { discord: room.discord?.inviteUrl ? room.discord : null }
  });
});

export const deleteGameRoomDiscord = asyncHandler(async (req, res) => {
  const room = await GameRoom.findById(req.params.id);
  if (!room) {
    res.status(404);
    throw new Error("Game room not found");
  }
  if (!isRoomHost(room, req.user._id)) {
    res.status(403);
    throw new Error("Only the room host can delete this Discord voice room");
  }

  try {
    if (room.discord?.channelId) await deleteDiscordChannel(room.discord.channelId);
    room.discord = undefined;
    await room.save();
    res.json({
      success: true,
      message: "Discord voice room removed.",
      data: { discord: null }
    });
  } catch (error) {
    sendDiscordRoomError(res, error);
  }
});
