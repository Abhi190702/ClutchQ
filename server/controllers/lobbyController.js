import crypto from "crypto";
import Lobby from "../models/Lobby.js";
import GamerProfile from "../models/GamerProfile.js";
import Request from "../models/Request.js";
import { asyncHandler } from "../middleware/errorMiddleware.js";
import { getGameForContext, getRankValue, isRankBetween } from "../utils/rankLogic.js";
import calculateSquadChemistry from "../utils/calculateSquadChemistry.js";
import calculateMatchScore from "../utils/calculateMatchScore.js";
import { deleteDiscordChannel } from "../services/discordService.js";
import { boundedQueryText } from "../utils/queryInput.js";
import { booleanInput, cleanTextInput, dateInput, numberInput } from "../utils/inputValue.js";

const inviteCode = () => crypto.randomBytes(3).toString("hex").toUpperCase();

const getViewerProfile = async (userId) => GamerProfile.findOne({ userId });

const getLobbyMemberProfiles = async (lobby) => {
  const memberIds = lobby.currentMembers.map((member) => member.userId?._id || member.userId);
  const profiles = await GamerProfile.find({ userId: { $in: memberIds } }).select("-customAvatar.dataUrl").populate({
    path: "userId",
    select: "name avatar role",
    match: { isSuspended: { $ne: true } }
  });
  return profiles.filter((profile) => profile.userId);
};

const getUserId = (value) => String(value?._id || value || "");

const getDisplayStartTime = (lobbyObject) => {
  const rawTime = lobbyObject.startTime || lobbyObject.createdAt || lobbyObject.updatedAt;
  const parsed = rawTime ? new Date(rawTime) : null;
  if (!parsed || Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
};

const canAccessLobbyDiscord = (lobby, userId) => {
  const viewerId = getUserId(userId);
  const ownerId = getUserId(lobby.ownerId);
  const isMember = lobby.currentMembers?.some((member) => getUserId(member.userId) === viewerId);

  return ownerId === viewerId || isMember;
};

const sanitizeLobbyForViewer = (lobby, userId) => {
  const lobbyObject = lobby.toObject ? lobby.toObject({ virtuals: true }) : { ...lobby };
  const serverNow = new Date();

  if (Array.isArray(lobbyObject.currentMembers)) {
    lobbyObject.currentMembers = lobbyObject.currentMembers.filter((member) => member?.userId);
  }

  lobbyObject.displayStartTime = getDisplayStartTime(lobbyObject);
  lobbyObject.serverTime = serverNow.toISOString();

  if (getUserId(lobbyObject.ownerId) !== getUserId(userId)) {
    delete lobbyObject.pendingRequests;
  }

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

const calculateLobbyViewerCompatibility = async (viewerProfile, lobby, providedMemberProfiles = null) => {
  if (!viewerProfile) return null;
  const memberProfiles = providedMemberProfiles || (await getLobbyMemberProfiles(lobby));
  const scores = memberProfiles.map((profile) => calculateMatchScore(viewerProfile, profile, { game: lobby.game }).totalScore);
  const lobbyGame = getGameForContext(viewerProfile, lobby.game);
  const inRank = isRankBetween(lobbyGame?.rankValue, lobby.rankMinValue, lobby.rankMaxValue);
  const warnings = [];

  if (!inRank) warnings.push("Your rank is outside this lobby range");
  if (lobby.micRequired && !viewerProfile.micAvailable) warnings.push("Mic required but your profile has mic off");
  if (String(viewerProfile.region || "").trim().toLowerCase() !== String(lobby.region || "").trim().toLowerCase()) {
    warnings.push("Region mismatch may affect ping");
  }
  const viewerLanguages = new Set((viewerProfile.languages || []).map((item) => String(item).trim().toLowerCase()));
  if (!viewerLanguages.has(String(lobby.language || "").trim().toLowerCase())) {
    warnings.push("Lobby language is not in your profile");
  }

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
  const game = boundedQueryText(req.query.game);
  const region = boundedQueryText(req.query.region);
  const language = boundedQueryText(req.query.language, 40);
  const mode = boundedQueryText(req.query.mode, 40);
  const query = { status: { $ne: "closed" } };

  if (game) query.game = game;
  if (region) query.region = region;
  if (language) query.language = language;
  if (mode) query.mode = mode;

  const viewerProfile = await getViewerProfile(req.user._id);
  const lobbies = await Lobby.find(query)
    .populate({ path: "ownerId", select: "name avatar", match: { isSuspended: { $ne: true } } })
    .populate({ path: "currentMembers.userId", select: "name avatar", match: { isSuspended: { $ne: true } } })
    .sort({ startTime: 1 })
    .limit(60);

  const visibleLobbies = lobbies.filter((lobby) => lobby.ownerId);

  const memberIds = [...new Set(visibleLobbies.flatMap((lobby) => lobby.currentMembers.map((member) => getUserId(member.userId))).filter(Boolean))];
  const memberProfiles = await GamerProfile.find({ userId: { $in: memberIds } }).select("-customAvatar.dataUrl").populate({
    path: "userId",
    select: "name avatar role",
    match: { isSuspended: { $ne: true } }
  });
  const profilesByUser = new Map(memberProfiles.filter((profile) => profile.userId).map((profile) => [getUserId(profile.userId), profile]));

  const enriched = await Promise.all(
    visibleLobbies.map(async (lobby) => {
      const lobbyProfiles = lobby.currentMembers.map((member) => profilesByUser.get(getUserId(member.userId))).filter(Boolean);
      return {
        lobby: sanitizeLobbyForViewer(lobby, req.user._id),
        compatibility: await calculateLobbyViewerCompatibility(viewerProfile, lobby, lobbyProfiles)
      };
    })
  );

  enriched.sort((left, right) => {
    const leftTime = new Date(left.lobby.displayStartTime || left.lobby.startTime || left.lobby.createdAt || 0).getTime();
    const rightTime = new Date(right.lobby.displayStartTime || right.lobby.startTime || right.lobby.createdAt || 0).getTime();
    return leftTime - rightTime;
  });

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

  const requestedPlayerCount = neededPlayers === undefined || neededPlayers === "" ? 4 : numberInput(neededPlayers);
  if (requestedPlayerCount === undefined || !Number.isInteger(requestedPlayerCount) || requestedPlayerCount < 2 || requestedPlayerCount > 10) {
    res.status(400);
    throw new Error("Lobby size must be a number between 2 and 10.");
  }
  const playerCount = requestedPlayerCount;
  const cleanTitle = cleanTextInput(title, 80);
  const cleanDescription = cleanTextInput(description, 500);
  const cleanGame = cleanTextInput(game, 100);
  const cleanRegion = cleanTextInput(region, 80);
  const cleanLanguage = cleanTextInput(language, 40);
  const cleanRankMin = cleanTextInput(rankMin, 50);
  const cleanRankMax = cleanTextInput(rankMax, 50);
  const minValue = getRankValue(cleanRankMin);
  const maxValue = getRankValue(cleanRankMax);
  const selectedGame = getGameForContext(profile, cleanGame);

  if (!cleanTitle || !cleanGame || !cleanRegion || !cleanLanguage || !cleanRankMin || !cleanRankMax) {
    res.status(400);
    throw new Error("Lobby title, game, region, and language cannot be empty");
  }

  if (Number.isFinite(minValue) && Number.isFinite(maxValue) && minValue > maxValue) {
    res.status(400);
    throw new Error("Minimum rank cannot be higher than maximum rank");
  }

  const parsedStartTime = startTime === undefined || startTime === "" ? new Date() : dateInput(startTime);
  if (!parsedStartTime) {
    res.status(400);
    throw new Error("Enter a valid lobby start time");
  }
  const serverNow = Date.now();
  if (parsedStartTime.getTime() < serverNow - 5 * 60 * 1000) {
    res.status(400);
    throw new Error("Lobby start time cannot be in the past.");
  }
  if (parsedStartTime.getTime() > serverNow + 90 * 24 * 60 * 60 * 1000) {
    res.status(400);
    throw new Error("Lobby start time must be within the next 90 days.");
  }

  const lobby = await Lobby.create({
    title: cleanTitle,
    ownerId: req.user._id,
    game: cleanGame,
    rankMin: cleanRankMin,
    rankMax: cleanRankMax,
    rankMinValue: minValue,
    rankMaxValue: maxValue,
    region: cleanRegion,
    language: cleanLanguage,
    micRequired: booleanInput(micRequired),
    neededPlayers: playerCount,
    neededRoles: Array.isArray(neededRoles)
      ? [...new Set(neededRoles.map((role) => cleanTextInput(role, 50)).filter(Boolean))].slice(0, playerCount)
      : [],
    currentMembers: [
      {
        userId: req.user._id,
        role: selectedGame?.roles?.[0] || "Flex",
        ready: false
      }
    ],
    mode: ["competitive", "casual", "scrim", "tournament"].includes(mode) ? mode : "competitive",
    startTime: parsedStartTime,
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
    .populate({ path: "ownerId", select: "name avatar", match: { isSuspended: { $ne: true } } })
    .populate({ path: "currentMembers.userId", select: "name avatar", match: { isSuspended: { $ne: true } } })
    .populate({
      path: "pendingRequests",
      populate: [
        { path: "fromUser", select: "name avatar" },
        { path: "toUser", select: "name avatar" }
      ]
    });

  if (!lobby || !lobby.ownerId) {
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
      warnings.push("Lobby closed, but its Discord voice cleanup will be retried.");
      console.error(`[${req.id || "no-request-id"}] Lobby Discord cleanup failed:`, error.message);
    }
  }

  res.json({
    success: true,
    message: "Lobby closed",
    data: lobby,
    warnings
  });
});

export const updateReadyCheck = asyncHandler(async (req, res) => {
  const lobby = await Lobby.findById(req.params.id);

  if (!lobby) {
    res.status(404);
    throw new Error("Lobby not found");
  }

  if (lobby.status === "closed") {
    res.status(409);
    throw new Error("Closed lobbies cannot update ready state");
  }

  const isMember = lobby.currentMembers.some((item) => String(item.userId) === String(req.user._id));
  if (!isMember) {
    res.status(403);
    throw new Error("Only lobby members can update ready check");
  }

  const ready = booleanInput(req.body.ready);
  const updated = await Lobby.findOneAndUpdate(
    { _id: lobby._id, status: { $ne: "closed" }, "currentMembers.userId": req.user._id },
    { $set: { "currentMembers.$.ready": ready } },
    { new: true, runValidators: true }
  );
  if (!updated) {
    res.status(409);
    throw new Error("This lobby closed before ready state could be updated.");
  }

  res.json({
    success: true,
    message: ready ? "Marked ready" : "Marked not ready",
    data: updated
  });
});

export const removePendingRequest = async (requestId, lobbyId) => {
  await Lobby.findByIdAndUpdate(lobbyId, { $pull: { pendingRequests: requestId } });
  await Request.findByIdAndUpdate(requestId, { status: "cancelled" });
};
