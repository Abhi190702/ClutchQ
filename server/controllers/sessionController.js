import Session from "../models/Session.js";
import Lobby from "../models/Lobby.js";
import GamerProfile from "../models/GamerProfile.js";
import { asyncHandler } from "../middleware/errorMiddleware.js";
import calculateSquadChemistry from "../utils/calculateSquadChemistry.js";

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
  const lobby = await Lobby.findById(req.body.lobbyId);

  if (!lobby) {
    res.status(404);
    throw new Error("Lobby not found");
  }

  if (String(lobby.ownerId) !== String(req.user._id)) {
    res.status(403);
    throw new Error("Only the lobby owner can start a session");
  }

  const memberIds = lobby.currentMembers.map((member) => member.userId);
  const profiles = await GamerProfile.find({ userId: { $in: memberIds } });
  const chemistry = calculateSquadChemistry(profiles, lobby);

  const session = await Session.create({
    lobbyId: lobby._id,
    game: lobby.game,
    mode: lobby.mode,
    members: lobby.currentMembers.map((member) => ({
      userId: member.userId,
      role: member.role,
      didShow: true
    })),
    chemistryScore: chemistry.chemistryScore,
    result: req.body.result || "scrim",
    startedAt: req.body.startedAt || new Date(),
    endedAt: req.body.endedAt,
    notes: req.body.notes
  });

  await GamerProfile.updateMany({ userId: { $in: memberIds } }, { $inc: { completedSessions: 1 } });

  res.status(201).json({
    success: true,
    message: "Session created",
    data: session
  });
});
