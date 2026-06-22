import crypto from "crypto";
import Lobby from "../models/Lobby.js";
import GamerProfile from "../models/GamerProfile.js";
import Request from "../models/Request.js";
import { asyncHandler } from "../middleware/errorMiddleware.js";
import { getPrimaryGame, getRankValue, isRankBetween } from "../utils/rankLogic.js";
import calculateSquadChemistry from "../utils/calculateSquadChemistry.js";
import calculateMatchScore from "../utils/calculateMatchScore.js";

const inviteCode = () => crypto.randomBytes(3).toString("hex").toUpperCase();

const getViewerProfile = async (userId) => GamerProfile.findOne({ userId });

const getLobbyMemberProfiles = async (lobby) => {
  const memberIds = lobby.currentMembers.map((member) => member.userId?._id || member.userId);
  return GamerProfile.find({ userId: { $in: memberIds } }).populate("userId", "name avatar role");
};

const getUserId = (value) => String(value?._id || value || "");

const canAccessLobbyDiscord = (lobby, userId) => {
  const viewerId = getUserId(userId);
  const ownerId = getUserId(lobby.ownerId);
  const isMember = lobby.currentMembers?.some((member) => getUserId(member.userId) === viewerId);

  return ownerId === viewerId || isMember;
};

const sanitizeLobbyForViewer = (lobby, userId) => {
  const lobbyObject = lobby.toObject ? lobby.toObject({ virtuals: true }) : { ...lobby };

  if (lobbyObject.discord && !canAccessLobbyDiscord(lobbyObject, userId)) {
    lobbyObject.discord = lobbyObject.discord.channelName
      ? {
          channelName: lobbyObject.discord.channelName,
          createdAt: lobbyObject.discord.createdAt
        }
      : undefined;
  }

  return lobbyObject;
};

const calculateLobbyViewerCompatibility = async (viewerProfile, lobby) => {
  if (!viewerProfile) return null;
  const memberProfiles = await getLobbyMemberProfiles(lobby);
  const scores = memberProfiles.map((profile) => calculateMatchScore(viewerProfile, profile, { game: lobby.game }).totalScore);
  const primaryGame = getPrimaryGame(viewerProfile);
  const inRank = isRankBetween(primaryGame?.rankValue, lobby.rankMinValue, lobby.rankMaxValue);
  const warnings = [];

  if (!inRank) warnings.push("Your rank is outside this lobby range");
  if (lobby.micRequired && !viewerProfile.micAvailable) warnings.push("Mic required but your profile has mic off");
  if (viewerProfile.region !== lobby.region) warnings.push("Region mismatch may affect ping");
  if (!viewerProfile.languages?.includes(lobby.language)) warnings.push("Lobby language is not in your profile");

  if (!scores.length) {
    return {
      score: null,
      warnings: warnings.length ? warnings : ["Not enough squad data yet"]
    };
  }

  const base = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  const modifiers = (inRank ? 8 : -12) + (warnings.length ? -warnings.length * 4 : 5);

  return {
    score: Math.max(0, Math.min(100, Math.round(base + modifiers))),
    warnings
  };
};

export const listLobbies = asyncHandler(async (req, res) => {
  const { game, region, language, mode } = req.query;
  const query = { status: { $ne: "closed" } };

  if (game) query.game = game;
  if (region) query.region = region;
  if (language) query.language = language;
  if (mode) query.mode = mode;

  const viewerProfile = await getViewerProfile(req.user._id);
  const lobbies = await Lobby.find(query)
    .populate("ownerId", "name avatar")
    .populate("currentMembers.userId", "name avatar")
    .sort({ startTime: 1 })
    .limit(60);

  const enriched = await Promise.all(
    lobbies.map(async (lobby) => ({
      lobby: sanitizeLobbyForViewer(lobby, req.user._id),
      compatibility: await calculateLobbyViewerCompatibility(viewerProfile, lobby)
    }))
  );

  res.json({
    success: true,
    message: "Lobbies loaded",
    data: enriched
  });
});

export const createLobby = asyncHandler(async (req, res) => {
  const profile = await getViewerProfile(req.user._id);

  if (!profile) {
    res.status(400);
    throw new Error("Create a gamer profile before creating a lobby");
  }

  const primaryGame = getPrimaryGame(profile);
  const {
    title,
    game,
    rankMin,
    rankMax,
    region,
    language,
    micRequired,
    neededPlayers,
    neededRoles,
    mode,
    startTime,
    description
  } = req.body;

  if (!title || !game || !rankMin || !rankMax || !region || !language) {
    res.status(400);
    throw new Error("Lobby title, game, rank range, region, and language are required");
  }

  const playerCount = Math.max(2, Math.min(10, Number(neededPlayers) || 4));
  const cleanTitle = String(title).trim().slice(0, 80);
  const cleanDescription = description ? String(description).trim().slice(0, 500) : "";

  if (!cleanTitle) {
    res.status(400);
    throw new Error("Lobby title is required");
  }

  const lobby = await Lobby.create({
    title: cleanTitle,
    ownerId: req.user._id,
    game,
    rankMin,
    rankMax,
    rankMinValue: getRankValue(rankMin),
    rankMaxValue: getRankValue(rankMax),
    region,
    language,
    micRequired: Boolean(micRequired),
    neededPlayers: playerCount,
    neededRoles: Array.isArray(neededRoles) ? neededRoles.slice(0, playerCount) : [],
    currentMembers: [
      {
        userId: req.user._id,
        role: primaryGame?.roles?.[0] || "Flex",
        ready: false
      }
    ],
    mode: mode || "competitive",
    startTime,
    description: cleanDescription,
    inviteCode: inviteCode()
  });

  await GamerProfile.findOneAndUpdate({ userId: req.user._id }, { $inc: { createdLobbies: 1 } });

  res.status(201).json({
    success: true,
    message: "Lobby created",
    data: lobby
  });
});

export const getLobby = asyncHandler(async (req, res) => {
  const lobby = await Lobby.findById(req.params.id)
    .populate("ownerId", "name avatar email")
    .populate("currentMembers.userId", "name avatar")
    .populate({
      path: "pendingRequests",
      populate: [
        { path: "fromUser", select: "name avatar email" },
        { path: "toUser", select: "name avatar email" }
      ]
    });

  if (!lobby) {
    res.status(404);
    throw new Error("Lobby not found");
  }

  const viewerProfile = await getViewerProfile(req.user._id);
  const memberProfiles = await getLobbyMemberProfiles(lobby);
  const chemistry = calculateSquadChemistry(memberProfiles, lobby);
  const compatibility = await calculateLobbyViewerCompatibility(viewerProfile, lobby);

  res.json({
    success: true,
    message: "Lobby loaded",
    data: {
      lobby: sanitizeLobbyForViewer(lobby, req.user._id),
      memberProfiles,
      chemistry,
      compatibility
    }
  });
});

export const closeLobby = asyncHandler(async (req, res) => {
  const lobby = await Lobby.findById(req.params.id);

  if (!lobby) {
    res.status(404);
    throw new Error("Lobby not found");
  }

  if (String(lobby.ownerId) !== String(req.user._id)) {
    res.status(403);
    throw new Error("Only the lobby owner can close this lobby");
  }

  lobby.status = "closed";
  await lobby.save();

  res.json({
    success: true,
    message: "Lobby closed",
    data: lobby
  });
});

export const updateReadyCheck = asyncHandler(async (req, res) => {
  const lobby = await Lobby.findById(req.params.id);

  if (!lobby) {
    res.status(404);
    throw new Error("Lobby not found");
  }

  const member = lobby.currentMembers.find((item) => String(item.userId) === String(req.user._id));
  if (!member) {
    res.status(403);
    throw new Error("Only lobby members can update ready check");
  }

  member.ready = Boolean(req.body.ready);
  await lobby.save();

  res.json({
    success: true,
    message: member.ready ? "Marked ready" : "Marked not ready",
    data: lobby
  });
});

export const removePendingRequest = async (requestId, lobbyId) => {
  await Lobby.findByIdAndUpdate(lobbyId, { $pull: { pendingRequests: requestId } });
  await Request.findByIdAndUpdate(requestId, { status: "cancelled" });
};
