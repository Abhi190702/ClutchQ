import User from "../models/User.js";
import GamerProfile from "../models/GamerProfile.js";
import Lobby from "../models/Lobby.js";
import Request from "../models/Request.js";
import Review from "../models/Review.js";
import Report from "../models/Report.js";
import Session from "../models/Session.js";
import { asyncHandler } from "../middleware/errorMiddleware.js";

const topByCount = (items, fallback = "None") => {
  if (!items.length) return fallback;
  const counts = items.reduce((map, value) => {
    if (!value) return map;
    map[value] = (map[value] || 0) + 1;
    return map;
  }, {});
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || fallback;
};

export const getAdminStats = asyncHandler(async (req, res) => {
  const [users, profiles, lobbies, requests, reviews, reports, sessions] = await Promise.all([
    User.find({}),
    GamerProfile.find({}).populate("userId", "name avatar email isSuspended"),
    Lobby.find({}),
    Request.find({}),
    Review.find({}),
    Report.find({}).populate("reporterId", "name avatar").populate("reportedUserId", "name avatar email"),
    Session.find({})
  ]);

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const gameNames = profiles.map((profile) => profile.games?.find((game) => game.isPrimary)?.gameName || profile.games?.[0]?.gameName);
  const regions = profiles.map((profile) => profile.region);
  const avgTrust = profiles.length ? Math.round(profiles.reduce((sum, profile) => sum + (profile.trustScore || 0), 0) / profiles.length) : 0;
  const avgMatch = sessions.length ? Math.round(sessions.reduce((sum, session) => sum + (session.chemistryScore || 70), 0) / sessions.length) : 82;

  const gamePopularity = Object.entries(
    gameNames.reduce((map, game) => {
      if (game) map[game] = (map[game] || 0) + 1;
      return map;
    }, {})
  ).map(([label, value]) => ({ label, value }));

  const lobbyHealth = ["open", "full", "closed"].map((status) => ({
    label: status,
    value: lobbies.filter((lobby) => lobby.status === status).length
  }));

  res.json({
    success: true,
    message: "Admin analytics loaded",
    data: {
      totals: {
        totalUsers: users.length,
        activeLobbies: lobbies.filter((lobby) => lobby.status === "open").length,
        totalLobbies: lobbies.length,
        totalRequests: requests.length,
        averageMatchScore: avgMatch,
        averageTrustScore: avgTrust,
        mostPlayedGame: topByCount(gameNames),
        mostActiveRegion: topByCount(regions),
        pendingReports: reports.filter((report) => report.status === "pending").length,
        newUsersThisWeek: users.filter((user) => user.createdAt >= oneWeekAgo).length
      },
      gamePopularity,
      lobbyHealth,
      recentReports: reports.slice(0, 8),
      topTrustedPlayers: profiles
        .sort((a, b) => (b.trustScore || 0) - (a.trustScore || 0))
        .slice(0, 8)
    }
  });
});

export const listAdminUsers = asyncHandler(async (req, res) => {
  const users = await User.find({}).select("-passwordHash").sort({ createdAt: -1 });
  const profiles = await GamerProfile.find({});
  const profileMap = new Map(profiles.map((profile) => [String(profile.userId), profile]));

  res.json({
    success: true,
    message: "Users loaded",
    data: users.map((user) => ({
      ...user.toObject(),
      profile: profileMap.get(String(user._id))
    }))
  });
});

export const listAdminReports = asyncHandler(async (req, res) => {
  const reports = await Report.find({})
    .populate("reporterId", "name avatar email")
    .populate("reportedUserId", "name avatar email isSuspended")
    .populate("reviewedBy", "name avatar email")
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    message: "Reports loaded",
    data: reports
  });
});

export const updateReport = asyncHandler(async (req, res) => {
  const { status, adminNote } = req.body;
  const report = await Report.findById(req.params.id);

  if (!report) {
    res.status(404);
    throw new Error("Report not found");
  }

  if (!["reviewed", "dismissed", "warned", "suspended", "banned"].includes(status)) {
    res.status(400);
    throw new Error("Invalid report action");
  }

  report.status = status;
  report.adminNote = adminNote;
  report.reviewedBy = req.user._id;
  await report.save();

  if (status === "suspended" || status === "banned") {
    await User.findByIdAndUpdate(report.reportedUserId, { isSuspended: true });
  }

  const populated = await Report.findById(report._id)
    .populate("reporterId", "name avatar email")
    .populate("reportedUserId", "name avatar email isSuspended")
    .populate("reviewedBy", "name avatar email");

  res.json({
    success: true,
    message: "Report updated",
    data: populated
  });
});
