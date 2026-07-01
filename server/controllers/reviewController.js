import Review from "../models/Review.js";
import GamerProfile from "../models/GamerProfile.js";
import Report from "../models/Report.js";
import Session from "../models/Session.js";
import User from "../models/User.js";
import { asyncHandler } from "../middleware/errorMiddleware.js";
import calculateTrustScore from "../utils/calculateTrustScore.js";
import generateBadges from "../utils/badgeEngine.js";
import mongoose from "mongoose";

const updateReviewedUserScores = async (reviewedUserId) => {
  const profile = await GamerProfile.findOne({ userId: reviewedUserId });
  if (!profile) return null;

  const reviews = await Review.find({ reviewedUserId });
  const validReports = await Report.countDocuments({ reportedUserId: reviewedUserId, status: { $ne: "dismissed" } });
  const trust = calculateTrustScore({ profile, reviews, validReports });

  profile.trustScore = trust.trustScore;
  profile.averageRatings = trust.ratingSummary;
  profile.totalReviews = reviews.length;
  profile.validReports = validReports;
  profile.badges = generateBadges({ profile: profile.toObject(), reviews, reportCount: validReports });
  await profile.save();

  return profile;
};

export const createReview = asyncHandler(async (req, res) => {
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

  const reviewedUser = await User.exists({ _id: reviewedUserId });
  if (!reviewedUser) {
    res.status(404);
    throw new Error("Reviewed user not found");
  }

  const scores = [communication, teamwork, skill, punctuality, behavior].map(Number);
  if (scores.some((score) => score < 1 || score > 5 || Number.isNaN(score))) {
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

    const duplicate = await Review.findOne({
      reviewerId: req.user._id,
      reviewedUserId,
      sessionId
    });

    if (duplicate) {
      res.status(409);
      throw new Error("You already reviewed this teammate for this session");
    }
  }

  const review = await Review.create({
    reviewerId: req.user._id,
    reviewedUserId,
    sessionId,
    communication,
    teamwork,
    skill,
    punctuality,
    behavior,
    comment: comment ? String(comment).trim().slice(0, 500) : ""
  });

  const profile = await updateReviewedUserScores(reviewedUserId);

  res.status(201).json({
    success: true,
    message: "Review submitted and trust score updated",
    data: {
      review,
      profile
    }
  });
});

export const listReviews = asyncHandler(async (req, res) => {
  const userId = req.query.userId || req.user._id;
  const reviews = await Review.find({ reviewedUserId: userId })
    .populate("reviewerId", "name avatar")
    .populate("reviewedUserId", "name avatar")
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    message: "Reviews loaded",
    data: reviews
  });
});
