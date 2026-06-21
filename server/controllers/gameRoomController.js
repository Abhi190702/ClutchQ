import Game from "../models/Game.js";
import GameRoom from "../models/GameRoom.js";
import { asyncHandler } from "../middleware/errorMiddleware.js";
import { createOrReuseLobbyRoom, deleteDiscordChannel, DiscordServiceError } from "../services/discordService.js";

const getId = (value) => String(value?._id || value || "");
const isRoomHost = (room, userId) => getId(room.hostId) === getId(userId);
const isRoomMember = (room, userId) => room.currentMembers?.some((member) => getId(member.userId) === getId(userId) && member.status !== "left");

const getRoom = async (id) =>
  GameRoom.findById(id).populate("hostId", "name avatar").populate("currentMembers.userId", "name avatar");

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

  if (!gameSlug || !title || !region || !language) {
    res.status(400);
    throw new Error("Game, room title, region, and language are required");
  }

  const game = await Game.findOne({ slug: gameSlug, active: true });
  if (!game) {
    res.status(404);
    throw new Error("Game not found");
  }

  const room = await GameRoom.create({
    gameId: game._id,
    gameSlug,
    title,
    hostId: req.user._id,
    mode: mode || game.supportedModes?.[0] || "Open Lobby",
    region,
    language,
    rankMin,
    rankMax,
    micRequired: Boolean(micRequired),
    maxMembers: Number(maxMembers) || game.teamSize || 5,
    currentMembers: [{ userId: req.user._id, role: neededRoles?.[0] || game.roles?.[0] || "Flex", ready: false }],
    neededRoles: neededRoles || game.roles?.slice(0, 3) || [],
    tags: tags || [],
    trustRequirement: Number(req.body.trustRequirement) || 60,
    startsAt
  });

  res.status(201).json({
    success: true,
    message: "Game room created",
    data: await getRoom(room._id)
  });
});

export const getGameRoom = asyncHandler(async (req, res) => {
  const room = await getRoom(req.params.id);
  if (!room) {
    res.status(404);
    throw new Error("Game room not found");
  }

  if (room.discord?.inviteUrl && !isRoomHost(room, req.user._id) && !isRoomMember(room, req.user._id)) {
    room.discord = room.discord.channelName ? { channelName: room.discord.channelName, createdAt: room.discord.createdAt } : undefined;
  }

  res.json({
    success: true,
    message: "Game room loaded",
    data: room
  });
});

export const joinGameRoom = asyncHandler(async (req, res) => {
  const room = await GameRoom.findById(req.params.id);
  if (!room) {
    res.status(404);
    throw new Error("Game room not found");
  }

  if (room.status !== "open") {
    res.status(400);
    throw new Error("This room is not open for joining");
  }

  if (isRoomMember(room, req.user._id)) {
    return res.json({
      success: true,
      message: "You are already in this room",
      data: await getRoom(room._id)
    });
  }

  if ((room.currentMembers?.filter((member) => member.status !== "left").length || 0) >= room.maxMembers) {
    res.status(400);
    throw new Error("This room is full");
  }

  room.currentMembers.push({
    userId: req.user._id,
    role: req.body.role || room.neededRoles?.[0] || "Flex",
    ready: false
  });
  await room.save();

  res.json({
    success: true,
    message: "Joined game room",
    data: await getRoom(room._id)
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

  room.currentMembers = room.currentMembers.filter((member) => getId(member.userId) !== getId(req.user._id));
  await room.save();

  res.json({
    success: true,
    message: "Left game room",
    data: await getRoom(room._id)
  });
});

export const updateGameRoomReady = asyncHandler(async (req, res) => {
  const room = await GameRoom.findById(req.params.id);
  if (!room) {
    res.status(404);
    throw new Error("Game room not found");
  }

  const member = room.currentMembers.find((item) => getId(item.userId) === getId(req.user._id));
  if (!member) {
    res.status(403);
    throw new Error("Only room members can update ready state");
  }

  member.ready = Boolean(req.body.ready);
  await room.save();

  res.json({
    success: true,
    message: member.ready ? "Marked ready" : "Marked not ready",
    data: await getRoom(room._id)
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

  const allowed = ["title", "mode", "region", "language", "rankMin", "rankMax", "micRequired", "maxMembers", "neededRoles", "tags", "status", "startsAt"];
  allowed.forEach((key) => {
    if (req.body[key] !== undefined) room[key] = req.body[key];
  });
  await room.save();

  res.json({
    success: true,
    message: "Game room updated",
    data: await getRoom(room._id)
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

  room.status = "cancelled";
  if (room.discord?.channelId) await deleteDiscordChannel(room.discord.channelId);
  room.discord = undefined;
  await room.save();

  res.json({
    success: true,
    message: "Game room cancelled",
    data: room
  });
});

const sendDiscordRoomError = (res, error) => {
  if (error instanceof DiscordServiceError) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }

  return res.status(500).json({ success: false, message: "Discord voice rooms are unavailable right now." });
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

  try {
    const discord = await createOrReuseLobbyRoom({
      _id: room._id,
      title: room.title,
      discord: room.discord
    });
    room.discord = discord;
    await room.save();

    res.json({
      success: true,
      message: "Discord voice room ready.",
      data: { discord: room.discord }
    });
  } catch (error) {
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
