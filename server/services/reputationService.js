import mongoose from "mongoose";
import Review from "../models/Review.js";
import Report from "../models/Report.js";
import GamerProfile from "../models/GamerProfile.js";
import calculateTrustScore from "../utils/calculateTrustScore.js";
import generateBadges from "../utils/badgeEngine.js";

const ratingFields = ["communication", "teamwork", "skill", "punctuality", "behavior"];
export const substantiatedReportStatuses = ["reviewed", "warned", "suspended", "banned"];

export const getReviewStats = async (reviewedUserId) => {
  const userId = mongoose.isValidObjectId(reviewedUserId) ? new mongoose.Types.ObjectId(reviewedUserId) : reviewedUserId;
  const rows = await Review.aggregate([
    { $match: { reviewedUserId: userId } },
    {
      $group: {
        _id: null,
        count: { $sum: 1 },
        communication: { $avg: "$communication" },
        teamwork: { $avg: "$teamwork" },
        skill: { $avg: "$skill" },
        punctuality: { $avg: "$punctuality" },
        behavior: { $avg: "$behavior" }
      }
    }
  ]);
  const row = rows[0] || {};
  const ratingSummary = ratingFields.reduce((summary, field) => {
    summary[field] = Number((Number(row[field]) || 0).toFixed(1));
    return summary;
  }, {});
  return { reviewCount: row.count || 0, ratingSummary };
};

export const recalculateReputation = async (userId) => {
  const profile = await GamerProfile.findOne({ userId });
  if (!profile) return null;

  const [{ reviewCount, ratingSummary }, validReports] = await Promise.all([
    getReviewStats(userId),
    Report.countDocuments({ reportedUserId: userId, status: { $in: substantiatedReportStatuses } })
  ]);
  const trust = calculateTrustScore({ profile, reviewCount, ratingSummary, validReports });
  profile.trustScore = trust.trustScore;
  profile.averageRatings = ratingSummary;
  profile.totalReviews = reviewCount;
  profile.validReports = validReports;
  profile.badges = generateBadges({
    profile: profile.toObject(),
    reportCount: validReports
  });
  await profile.save();
  return profile;
};
