import mongoose from "mongoose";
import Request from "../models/Request.js";
import Lobby from "../models/Lobby.js";
import GamerProfile from "../models/GamerProfile.js";
import User from "../models/User.js";
import { asyncHandler } from "../middleware/errorMiddleware.js";
import { getGameForContext } from "../utils/rankLogic.js";
import { isSharedDemoUser } from "../utils/demoAccounts.js";
import { cleanTextInput } from "../utils/inputValue.js";

const populateRequest = (query) =>
  query
    .populate("fromUser", "name avatar")
    .populate("toUser", "name avatar")
    .populate("lobbyId", "title game region status ownerId neededPlayers currentMembers");

const assertObjectId = (value, label) => {
  if (!mongoose.isValidObjectId(value)) {
    const error = new Error(`Invalid ${label}.`);
    error.statusCode = 400;
    throw error;
  }
};

export const createRequest = asyncHandler(async (req, res) => {
  const { toUser, lobbyId } = req.body;
  const type = cleanTextInput(req.body.type, 20).toLowerCase();

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
    assertObjectId(lobbyId, "lobby");

    lobby = await Lobby.findById(lobbyId);
    if (!lobby || lobby.status !== "open") {
      res.status(404);
      throw new Error("Open lobby not found");
    }

    if ((lobby.currentMembers?.length || 0) >= lobby.neededPlayers) {
      res.status(409);
      throw new Error("This lobby is already full");
    }

    if (lobby.currentMembers?.some((member) => String(member.userId) === String(req.user._id))) {
      res.status(409);
      throw new Error("You are already in this lobby");
    }

    targetUser = lobby.ownerId;
  }

  if (type === "teammate" && !targetUser) {
    res.status(400);
    throw new Error("Teammate request requires a target user");
  }

  assertObjectId(targetUser, "target user");
  if (String(targetUser) === String(req.user._id)) {
    res.status(400);
    throw new Error("You cannot send a request to yourself");
  }

  const targetAccount = await User.findOne({ _id: targetUser, isSuspended: { $ne: true } }).select("email");
  if (!targetAccount) {
    res.status(404);
    throw new Error("Player not found");
  }
  if (isSharedDemoUser(req.user) && !isSharedDemoUser(targetAccount)) {
    res.status(403);
    throw new Error("Shared demo accounts can only contact seeded demo players.");
  }

  const cleanMessage = cleanTextInput(req.body.message, 500);
  let request;
  try {
    request = await Request.create({
      fromUser: req.user._id,
      toUser: targetUser,
      lobbyId: type === "lobby" ? lobbyId : undefined,
      type,
      message: cleanMessage
    });
  } catch (error) {
    if (error?.code === 11000) {
      res.status(409);
      throw new Error("A pending request already exists");
    }
    throw error;
  }

  if (lobby) {
    const linked = await Lobby.updateOne(
      { _id: lobby._id, status: "open" },
      { $addToSet: { pendingRequests: request._id } }
    );
    if (!linked.matchedCount) {
      await Request.deleteOne({ _id: request._id, status: "pending" });
      res.status(409);
      throw new Error("This lobby is no longer accepting requests");
    }
  }

  const populated = await populateRequest(Request.findById(request._id));
  res.status(201).json({ success: true, message: "Request sent", data: populated });
});
export const listRequests = asyncHandler(async (req, res) => {
  const requests = await populateRequest(
    Request.find({
      $or: [{ fromUser: req.user._id }, { toUser: req.user._id }]
    })
      .sort({ createdAt: -1 })
      .limit(200)
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
  const status = cleanTextInput(req.body.status, 20).toLowerCase();
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
    const isRecipient = String(request.toUser) === String(req.user._id);
    const isLobbyOwner = request.lobbyId && String(request.lobbyId.ownerId) === String(req.user._id);
    if (!isRecipient && !isLobbyOwner) {
      res.status(403);
      throw new Error("Only the recipient or lobby owner can update this request");
    }
  }

  if (status === "accepted") {
    const activeSender = await User.exists({ _id: request.fromUser, isSuspended: { $ne: true } });
    if (!activeSender) {
      await Promise.all([
        Request.updateOne({ _id: request._id, status: "pending" }, { $set: { status: "cancelled" } }),
        request.lobbyId
          ? Lobby.updateOne({ _id: request.lobbyId._id }, { $pull: { pendingRequests: request._id } })
          : Promise.resolve()
      ]);
      res.status(409);
      throw new Error("This request is no longer available.");
    }
  }

  let memberRole = "Flex";
  if (request.type === "lobby" && status === "accepted") {
    if (!request.lobbyId) {
      res.status(404);
      throw new Error("Lobby not found");
    }
    const profile = await GamerProfile.findOne({ userId: request.fromUser });
    memberRole = getGameForContext(profile, request.lobbyId.game)?.roles?.[0] || "Flex";
  }

  const transitioned = await Request.findOneAndUpdate(
    { _id: request._id, status: "pending" },
    { $set: { status } },
    { new: true, runValidators: true }
  );
  if (!transitioned) {
    res.status(409);
    throw new Error("This request has already been resolved");
  }

  if (request.type === "lobby" && request.lobbyId) {
    if (status === "accepted") {
      const lobby = await Lobby.findOneAndUpdate(
        {
          _id: request.lobbyId._id,
          status: "open",
          "currentMembers.userId": { $ne: request.fromUser },
          $expr: { $lt: [{ $size: { $ifNull: ["$currentMembers", []] } }, "$neededPlayers"] }
        },
        {
          $push: { currentMembers: { userId: request.fromUser, role: memberRole, ready: false } },
          $pull: { pendingRequests: request._id }
        },
        { new: true, runValidators: true }
      );

      if (!lobby) {
        const alreadyMember = await Lobby.exists({ _id: request.lobbyId._id, "currentMembers.userId": request.fromUser });
        if (!alreadyMember) {
          await Promise.all([
            Request.updateOne({ _id: request._id, status: "accepted" }, { $set: { status: "rejected" } }),
            Lobby.updateOne({ _id: request.lobbyId._id }, { $pull: { pendingRequests: request._id } })
          ]);
          res.status(409);
          throw new Error("This lobby is already full or closed");
        }
        await Lobby.updateOne({ _id: request.lobbyId._id }, { $pull: { pendingRequests: request._id } });
      } else if (lobby.currentMembers.length >= lobby.neededPlayers) {
        await Lobby.updateOne({ _id: lobby._id, status: "open" }, { $set: { status: "full" } });
      }
    } else {
      await Lobby.updateOne({ _id: request.lobbyId._id }, { $pull: { pendingRequests: request._id } });
    }
  }

  const populated = await populateRequest(Request.findById(request._id));
  res.json({ success: true, message: `Request ${populated.status}`, data: populated });
});
