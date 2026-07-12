import User from "../models/User.js";
import GamerProfile from "../models/GamerProfile.js";
import Lobby from "../models/Lobby.js";
import Request from "../models/Request.js";
import Report from "../models/Report.js";
import Session from "../models/Session.js";
import { asyncHandler } from "../middleware/errorMiddleware.js";
import { recalculateReputation } from "../services/reputationService.js";
import { retireSuspendedUserResources } from "../services/moderationService.js";
import { cleanTextInput } from "../utils/inputValue.js";

const blockingReportStatuses = new Set(["suspended", "banned"]);
const activeProfileStages = [
  {
    $lookup: {
      from: User.collection.name,
      localField: "userId",
      foreignField: "_id",
      as: "activeAccount"
    }
  },
  { $match: { "activeAccount.0": { $exists: true }, "activeAccount.isSuspended": { $ne: true } } }
];

export const getAdminStats = asyncHandler(async (req, res) => {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [
    totalUsers,
    newUsersThisWeek,
    totalLobbies,
    activeLobbies,
    totalRequests,
    pendingReports,
    trustRows,
    matchRows,
    gamePopularityRows,
    regionRows,
    lobbyHealthRows,
    recentReports,
    topTrustedPlayers
  ] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ createdAt: { $gte: oneWeekAgo } }),
    Lobby.countDocuments({}),
    Lobby.countDocuments({ status: "open" }),
    Request.countDocuments({}),
    Report.countDocuments({ status: "pending" }),
    GamerProfile.aggregate([...activeProfileStages, { $group: { _id: null, value: { $avg: "$trustScore" } } }]),
    Session.aggregate([{ $group: { _id: null, value: { $avg: "$chemistryScore" } } }]),
    GamerProfile.aggregate([
      ...activeProfileStages,
      { $unwind: "$games" },
      { $match: { "games.isPrimary": true, "games.gameName": { $nin: [null, ""] } } },
      { $group: { _id: "$games.gameName", value: { $sum: 1 } } },
      { $sort: { value: -1, _id: 1 } },
      { $limit: 20 }
    ]),
    GamerProfile.aggregate([
      ...activeProfileStages,
      { $match: { region: { $nin: [null, ""] } } },
      { $group: { _id: "$region", value: { $sum: 1 } } },
      { $sort: { value: -1, _id: 1 } },
      { $limit: 20 }
    ]),
    Lobby.aggregate([{ $group: { _id: "$status", value: { $sum: 1 } } }]),
    Report.find({})
      .populate("reporterId", "name avatar")
      .populate("reportedUserId", "name avatar email")
      .sort({ createdAt: -1 })
      .limit(8),
    GamerProfile.find({})
      .select("-customAvatar.dataUrl")
      .populate({ path: "userId", select: "name avatar isSuspended", match: { isSuspended: { $ne: true } } })
      .sort({ trustScore: -1 })
      .limit(30)
  ]);

  const gamePopularity = gamePopularityRows.map((row) => ({ label: row._id, value: row.value }));
  const regions = regionRows.map((row) => ({ label: row._id, value: row.value }));
  const lobbyHealthMap = new Map(lobbyHealthRows.map((row) => [row._id, row.value]));
  const lobbyHealth = ["open", "full", "closed"].map((status) => ({ label: status, value: lobbyHealthMap.get(status) || 0 }));
  const avgTrust = Math.round(trustRows[0]?.value || 0);
  const avgMatch = Math.round(matchRows[0]?.value || 0);
  const visibleTopTrustedPlayers = topTrustedPlayers.filter((profile) => profile.userId).slice(0, 8);

  res.json({
    success: true,
    message: "Admin analytics loaded",
    data: {
      totals: {
        totalUsers,
        activeLobbies,
        totalLobbies,
        totalRequests,
        averageMatchScore: avgMatch,
        averageTrustScore: avgTrust,
        mostPlayedGame: gamePopularity[0]?.label || "None",
        mostActiveRegion: regions[0]?.label || "None",
        pendingReports,
        newUsersThisWeek
      },
      gamePopularity,
      lobbyHealth,
      recentReports,
      topTrustedPlayers: visibleTopTrustedPlayers
    }
  });
});

export const listAdminUsers = asyncHandler(async (req, res) => {
  const users = await User.find({}).sort({ createdAt: -1 }).limit(500);
  const profiles = await GamerProfile.find({ userId: { $in: users.map((user) => user._id) } }).select("-customAvatar.dataUrl");
  const profileMap = new Map(profiles.map((profile) => [String(profile.userId), profile]));

  res.json({
    success: true,
    message: "Users loaded",
    data: users.map((user) => ({
      ...(user.toSafeJSON ? user.toSafeJSON() : user.toObject()),
      profile: profileMap.get(String(user._id))
    }))
  });
});

export const listAdminReports = asyncHandler(async (req, res) => {
  const reports = await Report.find({})
    .populate("reporterId", "name avatar email")
    .populate("reportedUserId", "name avatar email isSuspended")
    .populate("reviewedBy", "name avatar email")
    .sort({ createdAt: -1 })
    .limit(500);

  res.json({
    success: true,
    message: "Reports loaded",
    data: reports
  });
});

export const updateReport = asyncHandler(async (req, res) => {
  const status = cleanTextInput(req.body.status, 20).toLowerCase();
  const adminNote = cleanTextInput(req.body.adminNote, 1000);
  const report = await Report.findById(req.params.id);

  if (!report) {
    res.status(404);
    throw new Error("Report not found");
  }

  if (!["reviewed", "dismissed", "warned", "suspended", "banned"].includes(status)) {
    res.status(400);
    throw new Error("Invalid report action");
  }

  const previousStatus = report.status;
  report.status = status;
  report.adminNote = adminNote;
  report.reviewedBy = req.user._id;
  await report.save();

  let moderationWarnings = [];
  if (blockingReportStatuses.has(status)) {
    await User.updateOne(
      { _id: report.reportedUserId, isSuspended: { $ne: true } },
      { $set: { isSuspended: true }, $inc: { tokenVersion: 1 } }
    );
    const retirement = await retireSuspendedUserResources(report.reportedUserId);
    moderationWarnings = retirement.warnings;
  } else if (blockingReportStatuses.has(previousStatus)) {
    const stillBlocked = await Report.exists({
      _id: { $ne: report._id },
      reportedUserId: report.reportedUserId,
      status: { $in: [...blockingReportStatuses] }
    });
    if (!stillBlocked) {
      await User.updateOne(
        { _id: report.reportedUserId, isSuspended: true },
        { $set: { isSuspended: false }, $inc: { tokenVersion: 1 } }
      );
    }
  }
  try {
    await recalculateReputation(report.reportedUserId);
  } catch {
    moderationWarnings.push("Moderation saved; reputation will refresh on the next profile or review update.");
  }

  const populated = await Report.findById(report._id)
    .populate("reporterId", "name avatar email")
    .populate("reportedUserId", "name avatar email isSuspended")
    .populate("reviewedBy", "name avatar email");

  res.json({
    success: true,
    message: "Report updated",
    data: populated,
    warnings: moderationWarnings
  });
});
