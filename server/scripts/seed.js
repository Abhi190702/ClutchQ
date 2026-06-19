import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import connectDB from "../config/db.js";
import User from "../models/User.js";
import GamerProfile from "../models/GamerProfile.js";
import Lobby from "../models/Lobby.js";
import Request from "../models/Request.js";
import Review from "../models/Review.js";
import Report from "../models/Report.js";
import Session from "../models/Session.js";
import calculateSquadChemistry from "../utils/calculateSquadChemistry.js";
import calculateTrustScore from "../utils/calculateTrustScore.js";
import generateBadges from "../utils/badgeEngine.js";
import {
  createDemoProfile,
  createProfilePayload,
  gamerNames,
  games,
  languages,
  pick,
  ranks,
  regions,
  roles
} from "../utils/seedData.js";

dotenv.config();
await connectDB();

await Promise.all([
  User.deleteMany({}),
  GamerProfile.deleteMany({}),
  Lobby.deleteMany({}),
  Request.deleteMany({}),
  Review.deleteMany({}),
  Report.deleteMany({}),
  Session.deleteMany({})
]);

const userPassword = await bcrypt.hash("demo123", 10);
const adminPassword = await bcrypt.hash("admin123", 10);

const admin = await User.create({
  name: "ClutchQ Admin",
  email: "admin@clutchq.com",
  passwordHash: adminPassword,
  role: "admin",
  avatar: "/clutchq-logo.svg"
});

const demo = await User.create({
  name: "Abhijeet",
  email: "demo@clutchq.com",
  passwordHash: userPassword,
  role: "user",
  avatar: "/clutchq-logo.svg"
});

const playerUsers = [];
for (const [index, name] of gamerNames.entries()) {
  playerUsers.push(
    await User.create({
      name,
      email: `${name.toLowerCase()}@clutchq.gg`,
      passwordHash: userPassword,
      avatar: `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=0f172a`
    })
  );
}

const demoProfile = await GamerProfile.create(createDemoProfile(demo._id));
const profiles = [demoProfile];

for (const [index, user] of playerUsers.entries()) {
  const payload = createProfilePayload(user._id, user.name, index);
  const profile = await GamerProfile.create(payload);
  profiles.push(profile);
}

const lobbyTitles = [
  "Valorant Ranked Push",
  "Gold/Plat Clean Comms",
  "Late Night Delhi Stack",
  "Controller Needed Tonight",
  "CS2 Mirage Utility Lab",
  "Apex Ranked Rotation",
  "BGMI Mic Only Push",
  "Dota 2 Support Queue",
  "Rocket League Diamond Run",
  "Fortnite Zero Build Trio",
  "SEA Scrim Block",
  "EU Tactical Warmup",
  "Middle East Comp Stack",
  "Minecraft Ranked Bedwars",
  "Call of Duty Objective Squad",
  "League Clash Practice"
];

const lobbies = [];
for (let index = 0; index < lobbyTitles.length; index += 1) {
  const ownerProfile = profiles[index + 1];
  const ownerGame = ownerProfile.games[0];
  const isValorantDemoLobby = index < 4;
  const lobby = await Lobby.create({
    title: lobbyTitles[index],
    ownerId: ownerProfile.userId,
    game: isValorantDemoLobby ? "Valorant" : pick(games, index),
    rankMin: isValorantDemoLobby ? "Gold 1" : pick(ranks, index),
    rankMax: isValorantDemoLobby ? "Platinum 2" : pick(ranks, index, 3),
    rankMinValue: isValorantDemoLobby ? 10 : 9 + (index % 6),
    rankMaxValue: isValorantDemoLobby ? 15 : 13 + (index % 8),
    region: isValorantDemoLobby ? "India" : pick(regions, index),
    language: isValorantDemoLobby ? "English" : pick(languages, index),
    micRequired: index % 3 !== 0,
    neededPlayers: 5,
    neededRoles: ["Duelist", "Controller", "Initiator", "Sentinel", "Flex"].slice(0, 3 + (index % 3)),
    currentMembers: [
      {
        userId: ownerProfile.userId,
        role: ownerGame.roles[0],
        ready: index % 2 === 0
      },
      {
        userId: profiles[index + 6]?.userId,
        role: pick(roles, index, 2),
        ready: index % 3 === 0
      }
    ].filter((member) => member.userId),
    status: "open",
    mode: index % 5 === 0 ? "scrim" : index % 7 === 0 ? "tournament" : index % 4 === 0 ? "casual" : "competitive",
    startTime: new Date(Date.now() + (index + 1) * 60 * 60 * 1000),
    description: `${lobbyTitles[index]} with role clarity, clean comms, and ready check before queue.`,
    inviteCode: `CQ${(3000 + index).toString(16).toUpperCase()}`
  });
  lobbies.push(lobby);
}

const requests = [];
for (let index = 0; index < 30; index += 1) {
  const from = profiles[(index + 4) % profiles.length];
  const to = index % 4 === 0 ? demoProfile : profiles[(index + 11) % profiles.length];
  const lobby = lobbies[index % lobbies.length];
  const type = index % 3 === 0 ? "lobby" : "teammate";
  const request = await Request.create({
    fromUser: type === "lobby" ? demo._id : from.userId,
    toUser: type === "lobby" ? lobby.ownerId : to.userId,
    lobbyId: type === "lobby" ? lobby._id : undefined,
    type,
    status: index % 8 === 0 ? "accepted" : index % 10 === 0 ? "rejected" : "pending",
    message: type === "lobby" ? "Your role balance looks good for my Duelist/Flex picks." : "Want to queue tonight? Our schedules overlap."
  });
  requests.push(request);

  if (type === "lobby" && request.status === "pending") {
    await Lobby.findByIdAndUpdate(lobby._id, { $addToSet: { pendingRequests: request._id } });
  }
}

const reviews = [];
for (let index = 0; index < 48; index += 1) {
  const reviewer = profiles[(index + 2) % profiles.length];
  const reviewed = profiles[(index + 9) % profiles.length];
  if (String(reviewer.userId) === String(reviewed.userId)) continue;

  reviews.push(
    await Review.create({
      reviewerId: reviewer.userId,
      reviewedUserId: reviewed.userId,
      communication: 3 + (index % 3),
      teamwork: 3 + ((index + 1) % 3),
      skill: 3 + ((index + 2) % 3),
      punctuality: 4 + (index % 2),
      behavior: 4 + ((index + 1) % 2),
      comment: "Good comms, clear role expectations, and reliable queue timing."
    })
  );
}

const reports = [];
for (let index = 0; index < 10; index += 1) {
  reports.push(
    await Report.create({
      reporterId: profiles[(index + 3) % profiles.length].userId,
      reportedUserId: profiles[(index + 18) % profiles.length].userId,
      reason: pick(["No-show", "Toxic comms", "Lobby spam", "Rank mismatch"], index),
      details: "Seeded moderation case for admin demo flow.",
      status: index % 4 === 0 ? "reviewed" : "pending"
    })
  );
}

for (let index = 0; index < 12; index += 1) {
  const lobby = lobbies[index % lobbies.length];
  const memberIds = lobby.currentMembers.map((member) => member.userId);
  const memberProfiles = await GamerProfile.find({ userId: { $in: memberIds } });
  const chemistry = calculateSquadChemistry(memberProfiles, lobby);

  await Session.create({
    lobbyId: lobby._id,
    game: lobby.game,
    mode: lobby.mode,
    members: lobby.currentMembers.map((member) => ({
      userId: member.userId,
      role: member.role,
      didShow: true
    })),
    chemistryScore: chemistry.chemistryScore,
    result: pick(["won", "lost", "scrim"], index),
    startedAt: new Date(Date.now() - (index + 1) * 24 * 60 * 60 * 1000),
    endedAt: new Date(Date.now() - (index + 1) * 24 * 60 * 60 * 1000 + 90 * 60 * 1000),
    notes: "Seeded session for profile history and admin analytics."
  });
}

for (const profile of await GamerProfile.find({})) {
  const userReviews = await Review.find({ reviewedUserId: profile.userId });
  const reportCount = await Report.countDocuments({ reportedUserId: profile.userId, status: { $ne: "dismissed" } });
  const trust = calculateTrustScore({ profile, reviews: userReviews, validReports: reportCount });
  profile.trustScore = trust.trustScore;
  profile.averageRatings = trust.ratingSummary;
  profile.totalReviews = userReviews.length;
  profile.validReports = reportCount;
  profile.badges = generateBadges({ profile: profile.toObject(), reviews: userReviews, reportCount });
  await profile.save();
}

console.log("ClutchQ seed complete");
console.log("Demo User: demo@clutchq.com / demo123");
console.log("Admin: admin@clutchq.com / admin123");
console.log(`Seeded ${profiles.length} profiles, ${lobbies.length} lobbies, ${requests.length} requests, ${reviews.length} reviews, ${reports.length} reports.`);
process.exit(0);
