import Review from "../models/Review.js";
import Session from "../models/Session.js";
import User from "../models/User.js";
import Lobby from "../models/Lobby.js";
import GamerProfile from "../models/GamerProfile.js";
import { asyncHandler } from "../middleware/errorMiddleware.js";
import mongoose from "mongoose";
import { recalculateReputation } from "../services/reputationService.js";
import { isSharedDemoUser } from "../utils/demoAccounts.js";
import { cleanTextInput, numberInput } from "../utils/inputValue.js";

export const createReview = asyncHandler(async (req, res) => {
  if (isSharedDemoUser(req.user)) {
    res.status(403);
    throw new Error("Shared demo accounts cannot submit trust reviews.");
  }
  const { reviewedUserId, sessionId, communication, teamwork, skill, punctuality, behavior, comment } = req.body;

  if (!reviewedUserId) {
    res.status(400);
    throw new Error("Reviewed user is required");
  }

  if (!mongoose.isValidObjectId(reviewedUserId)) {
    res.status(400);
    throw new Error("Invalid reviewed user");
  }

  if (String(reviewedUserId) === String(req.user._id)) {
    res.status(400);
    throw new Error("You cannot review yourself");
  }

  const reviewedUser = await User.exists({ _id: reviewedUserId, isSuspended: { $ne: true } });
  if (!reviewedUser) {
    res.status(404);
    throw new Error("Reviewed user not found");
  }

  const scores = [communication, teamwork, skill, punctuality, behavior].map((value) => numberInput(value));
  if (scores.some((score) => score === undefined || score < 1 || score > 5)) {
    res.status(400);
    throw new Error("All review scores must be between 1 and 5");
  }

  if (sessionId) {
    if (!mongoose.isValidObjectId(sessionId)) {
      res.status(400);
      throw new Error("Invalid session");
    }

    const session = await Session.findById(sessionId);
    if (!session) {
      res.status(404);
      throw new Error("Session not found");
    }

    const participantIds = new Set((session.members || []).map((member) => String(member.userId)));
    if (!participantIds.has(String(req.user._id)) || !participantIds.has(String(reviewedUserId))) {
      res.status(403);
      throw new Error("Reviews for a session can only be submitted by session teammates");
    }

    if (session.result === "cancelled") {
      res.status(400);
      throw new Error("Cancelled sessions cannot be reviewed");
    }

    const duplicate = await Review.findOne({
      reviewerId: req.user._id,
      reviewedUserId,
      sessionId
    });

    if (duplicate) {
      res.status(409);
      throw new Error("You already reviewed this teammate for this session");
    }
  } else {
    const pair = [req.user._id, reviewedUserId];
    const [sharedSession, sharedLobby, duplicate] = await Promise.all([
      Session.exists({ "members.userId": { $all: pair }, result: { $ne: "cancelled" } }),
      Lobby.exists({ "currentMembers.userId": { $all: pair }, status: "closed" }),
      Review.exists({ reviewerId: req.user._id, reviewedUserId, sessionId: null })
    ]);

    if (!sharedSession && !sharedLobby) {
      res.status(403);
      throw new Error("You can only review players from a completed shared lobby or session");
    }

    if (duplicate) {
      res.status(409);
      throw new Error("You already reviewed this teammate");
    }
  }

  const review = await Review.create({
    reviewerId: req.user._id,
    reviewedUserId,
    sessionId,
    communication: scores[0],
    teamwork: scores[1],
    skill: scores[2],
    punctuality: scores[3],
    behavior: scores[4],
    comment: cleanTextInput(comment, 500)
  });

  let profile = null;
  const warnings = [];
  try {
    profile = await recalculateReputation(reviewedUserId);
  } catch {
    profile = await GamerProfile.findOne({ userId: reviewedUserId });
    warnings.push("Review saved; reputation will refresh on the next profile or moderation update.");
  }

  res.status(201).json({
    success: true,
    message: "Review submitted and trust score updated",
    data: {
      review,
      profile
    },
    warnings
  });
});

export const listReviews = asyncHandler(async (req, res) => {
  const userId = req.query.userId || req.user._id;
  if (!mongoose.isValidObjectId(userId)) {
    res.status(400);
    throw new Error("Invalid user");
  }
  const reviews = await Review.find({ reviewedUserId: userId })
    .populate("reviewerId", "name avatar")
    .populate("reviewedUserId", "name avatar")
    .sort({ createdAt: -1 })
    .limit(100);

  res.json({
    success: true,
    message: "Reviews loaded",
    data: reviews
  });
});
