import Session from "../models/Session.js";
import Lobby from "../models/Lobby.js";
import Request from "../models/Request.js";
import GamerProfile from "../models/GamerProfile.js";
import { asyncHandler } from "../middleware/errorMiddleware.js";
import calculateSquadChemistry from "../utils/calculateSquadChemistry.js";
import mongoose from "mongoose";
import { recalculateReputation } from "../services/reputationService.js";
import { deleteDiscordChannel } from "../services/discordService.js";
import { cleanTextInput, dateInput } from "../utils/inputValue.js";

const closeLobbyAfterSession = async (lobby, requestId) => {
  const warnings = [];
  const discordChannelId = lobby.discord?.channelId;
  const pendingRequestIds = lobby.pendingRequests || [];
  lobby.status = "closed";
  lobby.pendingRequests = [];
  await lobby.save();
  await Request.updateMany(
    {
      status: "pending",
      $or: [{ lobbyId: lobby._id }, { _id: { $in: pendingRequestIds } }]
    },
    { $set: { status: "cancelled" } }
  );

  if (discordChannelId) {
    try {
      await deleteDiscordChannel(discordChannelId);
      await Lobby.updateOne(
        { _id: lobby._id, status: "closed", "discord.channelId": discordChannelId },
        { $unset: { discord: "" } }
      );
      lobby.discord = undefined;
    } catch (error) {
      warnings.push("Session saved, but the lobby Discord voice cleanup will be retried.");
      console.error(`[${requestId || "no-request-id"}] Session Discord cleanup failed:`, error.message);
    }
  }

  return warnings;
};

const refreshSessionReputation = async (memberIds) => {
  const uniqueIds = [...new Set(memberIds.map(String).filter((id) => mongoose.isValidObjectId(id)))].map(
    (id) => new mongoose.Types.ObjectId(id)
  );
  if (!uniqueIds.length) return [];
  const rows = await Session.aggregate([
    { $match: { result: { $ne: "cancelled" }, "members.userId": { $in: uniqueIds } } },
    { $unwind: "$members" },
    { $match: { "members.userId": { $in: uniqueIds } } },
    { $group: { _id: "$members.userId", count: { $sum: 1 } } }
  ]);
  const counts = new Map(rows.map((row) => [String(row._id), row.count]));
  await GamerProfile.bulkWrite(
    uniqueIds.map((userId) => ({
      updateOne: {
        filter: { userId },
        update: { $set: { completedSessions: counts.get(String(userId)) || 0 } }
      }
    })),
    { ordered: false }
  );

  const recalculations = await Promise.allSettled(uniqueIds.map((userId) => recalculateReputation(userId)));
  return recalculations
    .filter((result) => result.status === "rejected")
    .map(() => "A player reputation refresh will be retried after the next profile update.");
};

export const listSessions = asyncHandler(async (req, res) => {
  const sessions = await Session.find({ "members.userId": req.user._id })
    .populate("lobbyId", "title game")
    .populate("members.userId", "name avatar")
    .sort({ startedAt: -1, createdAt: -1 })
    .limit(30);

  res.json({
    success: true,
    message: "Sessions loaded",
    data: sessions
  });
});

export const createSessionFromLobby = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.body.lobbyId)) {
    res.status(400);
    throw new Error("Invalid lobby");
  }
  const lobby = await Lobby.findById(req.body.lobbyId);

  if (!lobby) {
    res.status(404);
    throw new Error("Lobby not found");
  }

  if (String(lobby.ownerId) !== String(req.user._id)) {
    res.status(403);
    throw new Error("Only the lobby owner can start a session");
  }

  const existingSession = await Session.findOne({ lobbyId: lobby._id });
  if (existingSession) {
    const warnings = [
      ...(await closeLobbyAfterSession(lobby, req.id)),
      ...(await refreshSessionReputation((existingSession.members || []).map((member) => member.userId)))
    ];
    return res.json({
      success: true,
      message: "Session already exists for this lobby",
      data: existingSession,
      warnings
    });
  }

  if (lobby.status === "closed") {
    res.status(409);
    throw new Error("Closed lobbies cannot start a new session");
  }

  if ((lobby.currentMembers?.length || 0) < 2) {
    res.status(409);
    throw new Error("At least two lobby members are required to start a session");
  }

  const memberIds = lobby.currentMembers.map((member) => member.userId);
  const profiles = await GamerProfile.find({ userId: { $in: memberIds } }).select("-customAvatar.dataUrl");
  const chemistry = calculateSquadChemistry(profiles, lobby);

  const requestedResult = cleanTextInput(req.body.result || "scrim", 20).toLowerCase();
  const result = requestedResult === "win" ? "won" : requestedResult === "loss" ? "lost" : requestedResult;
  if (!["won", "lost", "scrim", "cancelled"].includes(result)) {
    res.status(400);
    throw new Error("Invalid session result");
  }

  const serverNowDate = new Date();
  const lobbyStart = lobby.startTime ? new Date(lobby.startTime) : null;
  const usableLobbyStart =
    lobbyStart &&
    !Number.isNaN(lobbyStart.getTime()) &&
    lobbyStart <= serverNowDate &&
    lobbyStart.getTime() >= serverNowDate.getTime() - 24 * 60 * 60 * 1000;
  const startedAt = req.body.startedAt ? dateInput(req.body.startedAt) : usableLobbyStart ? lobbyStart : serverNowDate;
  const endedAt = req.body.endedAt ? dateInput(req.body.endedAt) : serverNowDate;
  if (!startedAt || !endedAt) {
    res.status(400);
    throw new Error("Invalid session date");
  }
  if (endedAt && endedAt < startedAt) {
    res.status(400);
    throw new Error("Session end time cannot be before its start time");
  }
  const serverNow = Date.now();
  const futureToleranceMs = 5 * 60 * 1000;
  const oldestAllowedStartMs = serverNow - 90 * 24 * 60 * 60 * 1000;
  if (startedAt.getTime() > serverNow + futureToleranceMs || (endedAt && endedAt.getTime() > serverNow + futureToleranceMs)) {
    res.status(400);
    throw new Error("Session dates cannot be in the future");
  }
  if (startedAt.getTime() < oldestAllowedStartMs) {
    res.status(400);
    throw new Error("A lobby session must be recorded within 90 days of play.");
  }
  if (endedAt && endedAt.getTime() - startedAt.getTime() > 24 * 60 * 60 * 1000) {
    res.status(400);
    throw new Error("A lobby session cannot be longer than 24 hours");
  }

  let session;
  try {
    session = await Session.create({
      lobbyId: lobby._id,
      game: lobby.game,
      mode: lobby.mode,
      members: lobby.currentMembers.map((member) => ({
        userId: member.userId,
        role: member.role,
        didShow: true
      })),
      chemistryScore: chemistry.chemistryScore,
      result,
      startedAt,
      endedAt,
      notes: cleanTextInput(req.body.notes, 1000)
    });
  } catch (error) {
    if (error?.code !== 11000) throw error;
    session = await Session.findOne({ lobbyId: lobby._id });
    const warnings = [
      ...(await closeLobbyAfterSession(lobby, req.id)),
      ...(await refreshSessionReputation((session?.members || []).map((member) => member.userId)))
    ];
    return res.json({ success: true, message: "Session already exists for this lobby", data: session, warnings });
  }

  const warnings = [
    ...(await closeLobbyAfterSession(lobby, req.id)),
    ...(await refreshSessionReputation(memberIds))
  ];

  res.status(201).json({
    success: true,
    message: "Session created",
    data: session,
    warnings
  });
});
