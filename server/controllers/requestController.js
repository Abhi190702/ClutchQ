import Request from "../models/Request.js";
import Lobby from "../models/Lobby.js";
import GamerProfile from "../models/GamerProfile.js";
import { asyncHandler } from "../middleware/errorMiddleware.js";
import { getPrimaryGame } from "../utils/rankLogic.js";

const populateRequest = (query) =>
  query
    .populate("fromUser", "name avatar email")
    .populate("toUser", "name avatar email")
    .populate("lobbyId", "title game region status ownerId neededPlayers currentMembers");

export const createRequest = asyncHandler(async (req, res) => {
  const { toUser, lobbyId, type, message } = req.body;

  if (!type || !["teammate", "lobby"].includes(type)) {
    res.status(400);
    throw new Error("Request type must be teammate or lobby");
  }

  let targetUser = toUser;
  let lobby = null;

  if (type === "lobby") {
    if (!lobbyId) {
      res.status(400);
      throw new Error("Lobby request requires lobbyId");
    }

    lobby = await Lobby.findById(lobbyId);
    if (!lobby || lobby.status !== "open") {
      res.status(404);
      throw new Error("Open lobby not found");
    }

    const memberCount = lobby.currentMembers?.length || 0;
    if (memberCount >= lobby.neededPlayers) {
      res.status(400);
      throw new Error("This lobby is already full");
    }

    const alreadyMember = lobby.currentMembers?.some((member) => String(member.userId) === String(req.user._id));
    if (alreadyMember) {
      res.status(409);
      throw new Error("You are already in this lobby");
    }

    targetUser = lobby.ownerId;
  }

  if (type === "teammate" && !targetUser) {
    res.status(400);
    throw new Error("Teammate request requires a target user");
  }

  if (String(targetUser) === String(req.user._id)) {
    res.status(400);
    throw new Error("You cannot send a request to yourself");
  }

  const duplicate = await Request.findOne({
    fromUser: req.user._id,
    toUser: targetUser,
    lobbyId: lobbyId || null,
    type,
    status: "pending"
  });

  if (duplicate) {
    res.status(409);
    throw new Error("A pending request already exists");
  }

  const request = await Request.create({
    fromUser: req.user._id,
    toUser: targetUser,
    lobbyId,
    type,
    message
  });

  if (lobby) {
    lobby.pendingRequests.push(request._id);
    await lobby.save();
  }

  const populated = await populateRequest(Request.findById(request._id));

  res.status(201).json({
    success: true,
    message: "Request sent",
    data: populated
  });
});

export const listRequests = asyncHandler(async (req, res) => {
  const requests = await populateRequest(
    Request.find({
      $or: [{ fromUser: req.user._id }, { toUser: req.user._id }]
    }).sort({ createdAt: -1 })
  );

  res.json({
    success: true,
    message: "Requests loaded",
    data: {
      incoming: requests.filter((request) => String(request.toUser?._id) === String(req.user._id) && request.status === "pending"),
      outgoing: requests.filter((request) => String(request.fromUser?._id) === String(req.user._id) && request.status === "pending"),
      history: requests.filter((request) => request.status !== "pending")
    }
  });
});

export const updateRequestStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const request = await Request.findById(req.params.id).populate("lobbyId");

  if (!request) {
    res.status(404);
    throw new Error("Request not found");
  }

  if (!["accepted", "rejected", "cancelled"].includes(status)) {
    res.status(400);
    throw new Error("Invalid request status");
  }

  if (request.status !== "pending") {
    res.status(409);
    throw new Error("This request has already been resolved");
  }

  if (status === "cancelled" && String(request.fromUser) !== String(req.user._id)) {
    res.status(403);
    throw new Error("Only the sender can cancel this request");
  }

  if (status !== "cancelled") {
    const isTeammateRecipient = String(request.toUser) === String(req.user._id);
    const isLobbyOwner = request.lobbyId && String(request.lobbyId.ownerId) === String(req.user._id);

    if (!isTeammateRecipient && !isLobbyOwner) {
      res.status(403);
      throw new Error("Only the recipient or lobby owner can update this request");
    }
  }

  if (request.type === "lobby" && status === "accepted" && request.lobbyId) {
    if (request.lobbyId.status !== "open" || (request.lobbyId.currentMembers?.length || 0) >= request.lobbyId.neededPlayers) {
      res.status(400);
      throw new Error("This lobby is already full");
    }
  }

  request.status = status;
  await request.save();

  if (request.type === "lobby" && request.lobbyId) {
    const lobby = await Lobby.findById(request.lobbyId._id);
    lobby.pendingRequests = lobby.pendingRequests.filter((id) => String(id) !== String(request._id));

    if (status === "accepted") {
      const profile = await GamerProfile.findOne({ userId: request.fromUser });
      const primaryGame = getPrimaryGame(profile);
      const alreadyMember = lobby.currentMembers.some((member) => String(member.userId) === String(request.fromUser));

      if (!alreadyMember) {
        lobby.currentMembers.push({
          userId: request.fromUser,
          role: primaryGame?.roles?.[0] || "Flex",
          ready: false
        });
      }

      if (lobby.currentMembers.length >= lobby.neededPlayers) {
        lobby.status = "full";
      }
    }

    await lobby.save();
  }

  const populated = await populateRequest(Request.findById(request._id));

  res.json({
    success: true,
    message: `Request ${status}`,
    data: populated
  });
});
