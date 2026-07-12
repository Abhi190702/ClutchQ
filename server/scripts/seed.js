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
import GameActivity from "../models/GameActivity.js";
import GamePlaytimeAggregate from "../models/GamePlaytimeAggregate.js";
import MatchAnalysis from "../models/MatchAnalysis.js";
import SteamAchievement from "../models/SteamAchievement.js";
import SteamFriend from "../models/SteamFriend.js";
import SteamGame from "../models/SteamGame.js";
import SteamSyncLog from "../models/SteamSyncLog.js";
import GameRoom from "../models/GameRoom.js";
import GameplayGraph from "../models/GameplayGraph.js";
import ScorecardAnalysis from "../models/ScorecardAnalysis.js";
import ScorecardUpload from "../models/ScorecardUpload.js";
import TeammateFeedback from "../models/TeammateFeedback.js";
import OtpToken from "../models/OtpToken.js";
import PasswordResetSession from "../models/PasswordResetSession.js";
import OAuthLoginCode from "../models/OAuthLoginCode.js";
import calculateSquadChemistry from "../utils/calculateSquadChemistry.js";
import calculateTrustScore from "../utils/calculateTrustScore.js";
import generateBadges from "../utils/badgeEngine.js";
import { assertDestructiveScriptAllowed } from "../utils/scriptSafety.js";
import { isProductionRuntime } from "../utils/runtimeEnv.js";
import { substantiatedReportStatuses } from "../services/reputationService.js";
import { cleanupDiscordChannelsBeforeDelete } from "../utils/scriptDiscordCleanup.js";
import {
  createDemoProfile,
  createProfilePayload,
  demoAccounts,
  gamerNames,
  games,
  languages,
  pick,
  ranks,
  regions,
  roles
} from "../utils/seedData.js";

dotenv.config();
assertDestructiveScriptAllowed("ALLOW_DESTRUCTIVE_SEED", "Full database seeding");
const productionRuntime = isProductionRuntime();
const adminPasswordValue = process.env.SEED_ADMIN_PASSWORD || (productionRuntime ? "" : "admin123");
if (productionRuntime && adminPasswordValue.length < 12) {
  throw new Error("SEED_ADMIN_PASSWORD must be at least 12 characters for a production seed.");
}
await connectDB();

const [existingLobbyDiscord, existingRoomDiscord] = await Promise.all([
  Lobby.find({ "discord.channelId": { $exists: true, $ne: "" } }).select("discord.channelId"),
  GameRoom.find({ "discord.channelId": { $exists: true, $ne: "" } }).select("discord.channelId")
]);
await cleanupDiscordChannelsBeforeDelete(
  [...existingLobbyDiscord, ...existingRoomDiscord],
  "Full database seeding"
);

await Promise.all([
  User.deleteMany({}),
  GamerProfile.deleteMany({}),
  Lobby.deleteMany({}),
  Request.deleteMany({}),
  Review.deleteMany({}),
  Report.deleteMany({}),
  Session.deleteMany({}),
  GameActivity.deleteMany({}),
  GamePlaytimeAggregate.deleteMany({}),
  MatchAnalysis.deleteMany({}),
  SteamGame.deleteMany({}),
  SteamFriend.deleteMany({}),
  SteamAchievement.deleteMany({}),
  SteamSyncLog.deleteMany({}),
  GameRoom.deleteMany({}),
  GameplayGraph.deleteMany({}),
  ScorecardAnalysis.deleteMany({}),
  ScorecardUpload.deleteMany({}),
  TeammateFeedback.deleteMany({}),
  OtpToken.deleteMany({}),
  PasswordResetSession.deleteMany({}),
  OAuthLoginCode.deleteMany({})
]);

const userPassword = await bcrypt.hash("demo123", 10);
const adminPassword = await bcrypt.hash(adminPasswordValue, 10);

const admin = await User.create({
  name: "ClutchQ Admin",
  email: "admin@clutchq.com",
  passwordHash: adminPassword,
  role: "admin",
  avatar: "/clutchq-logo.svg",
  emailVerified: true,
  emailVerifiedAt: new Date()
});

const demoUsers = [];
for (const account of demoAccounts) {
  demoUsers.push(
    await User.create({
      name: account.name,
      email: account.email,
      passwordHash: userPassword,
      role: "user",
      avatar: "/brand/clutchq-logo.png",
      emailVerified: true,
      emailVerifiedAt: new Date()
    })
  );
}
const demo = demoUsers[0];

const playerUsers = [];
for (const [index, name] of gamerNames.entries()) {
  playerUsers.push(
    await User.create({
      name,
      email: `${name.toLowerCase()}@clutchq.gg`,
      passwordHash: userPassword,
      avatar: `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=0f172a`,
      emailVerified: true,
      emailVerifiedAt: new Date()
    })
  );
}

const demoProfiles = [];
for (const [index, user] of demoUsers.entries()) {
  demoProfiles.push(await GamerProfile.create(createDemoProfile(user._id, demoAccounts[index], index)));
}
const demoProfile = demoProfiles[0];
const profileByEmail = new Map(demoUsers.map((user, index) => [user.email, demoProfiles[index]]));
const profiles = [...demoProfiles];

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
const demoLobbySeeds = [
  {
    title: "Valorant Gold/Plat Ranked Stack",
    ownerEmail: "captain@clutchq.com",
    game: "Valorant",
    rankMin: "Gold 1",
    rankMax: "Platinum 2",
    neededRoles: ["Duelist", "Sentinel", "Initiator"],
    mode: "competitive",
    language: "English",
    description: "Ranked stack with clear roles, Hindi/English comms, and disciplined retake calls."
  },
  {
    title: "CS2 Premier Night Queue",
    ownerEmail: "demo@clutchq.com",
    game: "CS2",
    rankMin: "Gold 1",
    rankMax: "Platinum 1",
    neededRoles: ["Entry", "Support", "AWP"],
    mode: "competitive",
    language: "Hindi",
    description: "Premier queue with utility plans, short comms, and late-night India timing."
  },
  {
    title: "Apex Ranked Chill Push",
    ownerEmail: "sentinel@clutchq.com",
    game: "Apex Legends",
    rankMin: "Gold 1",
    rankMax: "Platinum 1",
    neededRoles: ["Fragger", "Support"],
    mode: "casual",
    language: "English",
    description: "Chill ranked push with safe rotations and no rage comms."
  }
];

for (const [index, seed] of demoLobbySeeds.entries()) {
  const ownerProfile = profileByEmail.get(seed.ownerEmail);
  const ownerGame = ownerProfile.games[0];
  lobbies.push(
    await Lobby.create({
      title: seed.title,
      ownerId: ownerProfile.userId,
      game: seed.game,
      rankMin: seed.rankMin,
      rankMax: seed.rankMax,
      rankMinValue: seed.rankMin === "Gold 1" ? 10 : 9,
      rankMaxValue: seed.rankMax.includes("Platinum 2") ? 15 : 13,
      region: "India",
      language: seed.language,
      micRequired: true,
      neededPlayers: seed.game === "Apex Legends" ? 3 : 5,
      neededRoles: seed.neededRoles,
      currentMembers: [
        {
          userId: ownerProfile.userId,
          role: ownerGame.roles[0],
          ready: true
        }
      ],
      status: "open",
      mode: seed.mode,
      startTime: new Date(Date.now() + (index + 1) * 45 * 60 * 1000),
      description: seed.description,
      inviteCode: `DEMO${index + 1}`
    })
  );
}

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
const addRequest = async ({ fromEmail, toEmail, lobby, type = "teammate", status = "pending", message }) => {
  const from = demoUsers.find((user) => user.email === fromEmail);
  const to = toEmail ? demoUsers.find((user) => user.email === toEmail) : null;
  const request = await Request.create({
    fromUser: from._id,
    toUser: type === "lobby" ? lobby.ownerId : to._id,
    lobbyId: type === "lobby" ? lobby._id : undefined,
    type,
    status,
    message
  });
  requests.push(request);
  if (type === "lobby" && status === "pending") {
    await Lobby.findByIdAndUpdate(lobby._id, { $addToSet: { pendingRequests: request._id } });
  }
  return request;
};

await addRequest({
  fromEmail: "captain@clutchq.com",
  toEmail: "demo@clutchq.com",
  message: "Your Duelist/Flex pool fits tonight's ranked stack. Want to queue?"
});
await addRequest({
  fromEmail: "demo@clutchq.com",
  toEmail: "sentinel@clutchq.com",
  message: "Need your Sentinel utility for a late ranked push."
});
await addRequest({
  fromEmail: "demo@clutchq.com",
  lobby: lobbies[0],
  type: "lobby",
  message: "I can fill Duelist and keep comms clean for the Gold/Plat stack."
});
await addRequest({
  fromEmail: "captain@clutchq.com",
  toEmail: "sentinel@clutchq.com",
  message: "Your anchor style fits our ranked tempo."
});
await addRequest({
  fromEmail: "sentinel@clutchq.com",
  toEmail: "flex@clutchq.com",
  status: "accepted",
  message: "Let's keep Flex as utility support for scrims."
});

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
for (let index = 0; index < 8; index += 1) {
  reviews.push(
    await Review.create({
      reviewerId: profiles[index + 1].userId,
      reviewedUserId: demoProfile.userId,
      communication: 5,
      teamwork: 5,
      skill: index % 2 === 0 ? 5 : 4,
      punctuality: 5,
      behavior: 5,
      comment: "Reliable Duelist, strong comms, and consistently ready for ranked queues."
    })
  );
}

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

const gameSlugMap = {
  Valorant: "valorant",
  CS2: "counter-strike-2",
  "Apex Legends": "apex-legends",
  "The Finals": "the-finals",
  "Lethal Company": "lethal-company",
  Phasmophobia: "phasmophobia",
  "Rocket League": "rocket-league",
  "Dota 2": "dota-2",
  "PUBG Battlegrounds": "pubg-battlegrounds",
  "Helldivers 2": "helldivers-2"
};
const steamIdByEmail = {
  "demo@clutchq.com": "76561199000072910",
  "captain@clutchq.com": "76561199000072911",
  "sentinel@clutchq.com": "76561199000072912",
  "flex@clutchq.com": "76561199000072913"
};
const activityNotes = [
  "Clean comms, strong retake calls.",
  "Good role balance, slow start.",
  "Needed better utility timing.",
  "Great mid-round adjustment and calm close.",
  "Lost tempo after eco, but comms stayed clear.",
  "Strong rotations and clean trade discipline."
];
const demoActivityPlans = {
  "demo@clutchq.com": [
    ["Valorant", 150, 91],
    ["CS2", 120, 84],
    ["Apex Legends", 105, 78],
    ["The Finals", 80, 86],
    ["Lethal Company", 65, 74]
  ],
  "captain@clutchq.com": [
    ["Valorant", 170, 94],
    ["CS2", 140, 88],
    ["Dota 2", 125, 82],
    ["The Finals", 90, 85],
    ["Rocket League", 70, 79]
  ],
  "sentinel@clutchq.com": [
    ["Valorant", 135, 88],
    ["Apex Legends", 125, 86],
    ["Phasmophobia", 85, 80],
    ["Lethal Company", 95, 83],
    ["Helldivers 2", 75, 81]
  ],
  "flex@clutchq.com": [
    ["CS2", 155, 87],
    ["Valorant", 115, 82],
    ["The Finals", 105, 85],
    ["Rocket League", 75, 78],
    ["Apex Legends", 70, 76]
  ]
};
const steamLibraryPlans = {
  "demo@clutchq.com": [
    [730, "Counter-Strike 2", 10800, 740],
    [1172470, "Apex Legends", 5400, 420],
    [2073850, "The Finals", 2700, 260],
    [1966720, "Lethal Company", 1800, 210],
    [553850, "Helldivers 2", 1500, 120],
    [252490, "Rust", 980, 0],
    [945360, "Among Us", 900, 60],
    [413150, "Stardew Valley", 840, 0]
  ],
  "captain@clutchq.com": [
    [730, "Counter-Strike 2", 25200, 900],
    [570, "Dota 2", 18000, 540],
    [2073850, "The Finals", 4800, 360],
    [252950, "Rocket League", 3600, 160],
    [1172470, "Apex Legends", 3200, 120],
    [739630, "Phasmophobia", 1100, 0]
  ],
  "sentinel@clutchq.com": [
    [1172470, "Apex Legends", 12600, 760],
    [1966720, "Lethal Company", 5400, 410],
    [739630, "Phasmophobia", 4200, 300],
    [553850, "Helldivers 2", 3600, 220],
    [730, "Counter-Strike 2", 2600, 90],
    [252950, "Rocket League", 1800, 80]
  ],
  "flex@clutchq.com": [
    [730, "Counter-Strike 2", 9600, 620],
    [2073850, "The Finals", 6300, 440],
    [252950, "Rocket League", 4600, 260],
    [1172470, "Apex Legends", 4100, 180],
    [570, "Dota 2", 3000, 120],
    [553850, "Helldivers 2", 1700, 90]
  ]
};

for (const user of demoUsers) {
  const plan = demoActivityPlans[user.email] || demoActivityPlans["demo@clutchq.com"];
  const activities = [];
  for (let index = 0; index < 36; index += 1) {
    const [gameName, baseMinutes, baseRating] = plan[index % plan.length];
    const startedAt = new Date(Date.now() - (index + 1) * 36 * 60 * 60 * 1000 - (index % 4) * 60 * 60 * 1000);
    const durationMinutes = Math.max(38, baseMinutes + ((index % 5) - 2) * 12);
    const endedAt = new Date(startedAt.getTime() + durationMinutes * 60 * 1000);
    activities.push(
      await GameActivity.create({
        userId: user._id,
        gameSlug: gameSlugMap[gameName] || gameName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        gameName,
        source: "demo",
        startedAt,
        endedAt,
        durationMinutes,
        status: "completed",
        result: index % 5 === 0 ? "loss" : index % 3 === 0 ? "completed" : "win",
        matchRating: Math.max(55, Math.min(96, baseRating + ((index % 7) - 3) * 2)),
        teamworkScore: 78 + (index % 15),
        communicationScore: 80 + (index % 12),
        reliabilityScore: 88 + (index % 8),
        performanceScore: 74 + (index % 17),
        notes: activityNotes[index % activityNotes.length]
      })
    );
  }

  const aggregateMap = new Map();
  for (const activity of activities) {
    const row = aggregateMap.get(activity.gameSlug) || {
      userId: user._id,
      gameSlug: activity.gameSlug,
      gameName: activity.gameName,
      totalMinutes: 0,
      weeklyMinutes: 0,
      monthlyMinutes: 0,
      sessionsCount: 0,
      lastPlayedAt: activity.endedAt
    };
    row.totalMinutes += activity.durationMinutes;
    if (activity.endedAt > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) row.weeklyMinutes += activity.durationMinutes;
    if (activity.endedAt > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) row.monthlyMinutes += activity.durationMinutes;
    row.sessionsCount += 1;
    row.lastPlayedAt = row.lastPlayedAt > activity.endedAt ? row.lastPlayedAt : activity.endedAt;
    aggregateMap.set(activity.gameSlug, row);

    if (activities.indexOf(activity) < 8) {
      await MatchAnalysis.create({
        userId: user._id,
        gameSlug: activity.gameSlug,
        gameName: activity.gameName,
        activityId: activity._id,
        category: activity.gameName === "Valorant" || activity.gameName === "CS2" ? "FPS Tactical" : "Team Game",
        matchRating: activity.matchRating,
        teamworkScore: activity.teamworkScore,
        communicationScore: activity.communicationScore,
        reliabilityScore: activity.reliabilityScore,
        performanceScore: activity.performanceScore,
        trustImpact: Math.round((activity.matchRating - 70) / 5),
        highlights: ["Clear role discipline", "Good teammate pacing"],
        improvementAreas: activity.matchRating < 75 ? ["Tighter utility timing"] : ["Keep the same comms tempo"],
        sourceBreakdown: { teamwork: "demo activity", communication: "demo activity", reliability: "demo activity" }
      });
    }
  }
  await GamePlaytimeAggregate.insertMany([...aggregateMap.values()]);

  const steamId = steamIdByEmail[user.email];
  const library = steamLibraryPlans[user.email] || steamLibraryPlans["demo@clutchq.com"];
  await SteamGame.insertMany(
    library.map(([appId, name, total, twoWeeks], index) => ({
      userId: user._id,
      steamId,
      appId,
      name,
      iconUrl: `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`,
      logoUrl: `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`,
      playtimeForeverMinutes: total,
      playtimeLastTwoWeeksMinutes: twoWeeks,
      lastPlayedAt: twoWeeks ? new Date(Date.now() - (index + 1) * 24 * 60 * 60 * 1000) : new Date(Date.now() - (index + 40) * 24 * 60 * 60 * 1000),
      hasCommunityVisibleStats: true,
      source: "demo",
      lastSyncedAt: new Date()
    }))
  );

  await SteamAchievement.insertMany(
    library.slice(0, 5).flatMap(([appId, name], index) => [
      {
        userId: user._id,
        steamId,
        appId,
        gameName: name,
        achievementName: `${name.replace(/\W+/g, "_").toUpperCase()}_CLUTCH`,
        displayName: "Clutch Round",
        description: "Won a tense late-game round with the squad.",
        achieved: true,
        unlockTime: new Date(Date.now() - (index + 3) * 24 * 60 * 60 * 1000),
        rarityPercent: 8 + index * 3,
        lastSyncedAt: new Date()
      },
      {
        userId: user._id,
        steamId,
        appId,
        gameName: name,
        achievementName: `${name.replace(/\W+/g, "_").toUpperCase()}_TEAM`,
        displayName: "Team Discipline",
        description: "Completed a clean coordinated match.",
        achieved: index % 4 !== 0,
        unlockTime: index % 4 !== 0 ? new Date(Date.now() - (index + 7) * 24 * 60 * 60 * 1000) : undefined,
        rarityPercent: 18 + index * 4,
        lastSyncedAt: new Date()
      }
    ])
  );

  const otherUsers = demoUsers.filter((candidate) => candidate.email !== user.email);
  await SteamFriend.insertMany(
    otherUsers.map((friend, index) => ({
      userId: user._id,
      steamId,
      friendSteamId: steamIdByEmail[friend.email],
      relationship: "friend",
      friendSince: new Date(Date.now() - (420 - index * 55) * 24 * 60 * 60 * 1000),
      displayName: friend.name,
      avatar: friend.avatar,
      profileUrl: `https://steamcommunity.com/id/clutchq-${friend.email.split("@")[0]}`,
      lastSyncedAt: new Date(),
      onClutchQ: true,
      clutchQUserId: friend._id
    }))
  );

  await SteamSyncLog.create({
    userId: user._id,
    steamId,
    syncType: "demo",
    status: "success",
    message: "Seeded demo Steam-like data for live judging.",
    startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    finishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000 + 5000),
    counts: {
      games: library.length,
      achievements: library.slice(0, 5).length * 2,
      friends: otherUsers.length,
      recentGames: library.filter((game) => game[3] > 0).length
    }
  });
}

for (const profile of await GamerProfile.find({})) {
  const userReviews = await Review.find({ reviewedUserId: profile.userId });
  const reportCount = await Report.countDocuments({
    reportedUserId: profile.userId,
    status: { $in: substantiatedReportStatuses }
  });
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
console.log(`Admin: admin@clutchq.com / ${productionRuntime ? "password from SEED_ADMIN_PASSWORD" : "admin123"}`);
console.log(`Seeded ${profiles.length} profiles, ${lobbies.length} lobbies, ${requests.length} requests, ${reviews.length} reviews, ${reports.length} reports.`);
process.exit(0);
