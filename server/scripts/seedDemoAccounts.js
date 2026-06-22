import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import User from "../models/User.js";
import GamerProfile from "../models/GamerProfile.js";
import Lobby from "../models/Lobby.js";
import Request from "../models/Request.js";
import Review from "../models/Review.js";
import GameActivity from "../models/GameActivity.js";
import GamePlaytimeAggregate from "../models/GamePlaytimeAggregate.js";
import MatchAnalysis from "../models/MatchAnalysis.js";
import GameplayGraph from "../models/GameplayGraph.js";
import ScorecardAnalysis from "../models/ScorecardAnalysis.js";
import ScorecardUpload from "../models/ScorecardUpload.js";
import SteamAchievement from "../models/SteamAchievement.js";
import SteamFriend from "../models/SteamFriend.js";
import SteamGame from "../models/SteamGame.js";
import SteamSyncLog from "../models/SteamSyncLog.js";
import TeammateFeedback from "../models/TeammateFeedback.js";
import { createDemoProfile, demoAccounts } from "../utils/seedData.js";

dotenv.config();

const demoPassword = "demo123";
const demoEmails = demoAccounts.map((account) => account.email);
const steamIdByEmail = {
  "demo@clutchq.com": "76561199000072910",
  "captain@clutchq.com": "76561199000072911",
  "sentinel@clutchq.com": "76561199000072912",
  "flex@clutchq.com": "76561199000072913"
};

const gameSlugMap = {
  Valorant: "valorant",
  CS2: "counter-strike-2",
  "Apex Legends": "apex-legends",
  "The Finals": "the-finals",
  "Lethal Company": "lethal-company",
  Phasmophobia: "phasmophobia",
  "Rocket League": "rocket-league",
  "Dota 2": "dota-2",
  "Helldivers 2": "helldivers-2"
};

const activityPlans = {
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

const steamLibraries = {
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

const notes = [
  "Clean comms, strong retake calls.",
  "Good role balance, slow start.",
  "Needed better utility timing.",
  "Great mid-round adjustment and calm close.",
  "Lost tempo after eco, but comms stayed clear.",
  "Strong rotations and clean trade discipline."
];

const upsertDemoUsers = async () => {
  const passwordHash = await bcrypt.hash(demoPassword, 10);
  const users = [];

  for (const [index, account] of demoAccounts.entries()) {
    const user = await User.findOneAndUpdate(
      { email: account.email },
      {
        $set: {
          name: account.name,
          email: account.email,
          passwordHash,
          role: "user",
          avatar: "/brand/clutchq-logo.png",
          isSuspended: false
        }
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    await GamerProfile.findOneAndUpdate(
      { userId: user._id },
      { $set: createDemoProfile(user._id, account, index) },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    users.push(user);
  }

  return users;
};

const resetDemoOnlyCollections = async (users) => {
  const userIds = users.map((user) => user._id);

  const oldDemoLobbies = await Lobby.find({
    $or: [{ ownerId: { $in: userIds } }, { inviteCode: { $in: ["DEMO1", "DEMO2", "DEMO3"] } }]
  }).select("_id");
  const lobbyIds = oldDemoLobbies.map((lobby) => lobby._id);

  await Promise.all([
    Lobby.deleteMany({ _id: { $in: lobbyIds } }),
    Request.deleteMany({ $or: [{ fromUser: { $in: userIds } }, { toUser: { $in: userIds } }, { lobbyId: { $in: lobbyIds } }] }),
    Review.deleteMany({ $or: [{ reviewerId: { $in: userIds } }, { reviewedUserId: { $in: userIds } }] }),
    GameActivity.deleteMany({ userId: { $in: userIds }, source: "demo" }),
    GamePlaytimeAggregate.deleteMany({ userId: { $in: userIds } }),
    MatchAnalysis.deleteMany({ userId: { $in: userIds } }),
    ScorecardUpload.deleteMany({ userId: { $in: userIds } }),
    ScorecardAnalysis.deleteMany({ userId: { $in: userIds } }),
    TeammateFeedback.deleteMany({ $or: [{ fromUserId: { $in: userIds } }, { toUserId: { $in: userIds } }] }),
    GameplayGraph.deleteMany({ userId: { $in: userIds } }),
    SteamGame.deleteMany({ userId: { $in: userIds } }),
    SteamFriend.deleteMany({ userId: { $in: userIds } }),
    SteamAchievement.deleteMany({ userId: { $in: userIds } }),
    SteamSyncLog.deleteMany({ userId: { $in: userIds }, syncType: "demo" })
  ]);
};

const createIntelligenceDemoData = async (users) => {
  const byEmail = new Map(users.map((user) => [user.email, user]));
  const allActivities = await GameActivity.find({ userId: { $in: users.map((user) => user._id) }, source: "demo" }).sort({ startedAt: -1 });

  for (const user of users) {
    const activities = allActivities.filter((activity) => String(activity.userId) === String(user._id)).slice(0, 8);
    const analyses = [];

    for (const [index, activity] of activities.entries()) {
      const upload = await ScorecardUpload.create({
        userId: user._id,
        sessionId: activity._id,
        gameSlug: activity.gameSlug,
        gameName: activity.gameName,
        imageMime: "",
        imageSizeBytes: 0,
        status: "processed",
        source: "demo",
        processedAt: new Date()
      });
      const combat = Math.max(58, Math.min(96, activity.performanceScore + ((index % 4) - 1) * 3));
      const support = Math.max(60, Math.min(96, activity.teamworkScore + ((index % 3) - 1) * 2));
      const survival = Math.max(55, Math.min(94, activity.reliabilityScore - (index % 5)));
      const objectiveFocus = Math.max(60, Math.min(95, activity.communicationScore + (index % 4)));
      const overall = Math.round(combat * 0.28 + support * 0.24 + survival * 0.16 + objectiveFocus * 0.2 + activity.matchRating * 0.12);
      analyses.push(
        await ScorecardAnalysis.create({
          userId: user._id,
          sessionId: activity._id,
          uploadId: upload._id,
          gameSlug: activity.gameSlug,
          gameName: activity.gameName,
          detectedGame: activity.gameName,
          gameType: ["valorant", "counter-strike-2", "apex-legends"].includes(activity.gameSlug) ? "fps" : "coop",
          extractedStats: {
            kills: 12 + index * 2,
            deaths: 8 + (index % 5),
            assists: 5 + (index % 7),
            score: 220 + index * 24,
            result: activity.result,
            durationMinutes: activity.durationMinutes
          },
          performance: {
            combat,
            survival,
            support,
            objectiveFocus,
            consistency: activity.matchRating,
            impact: Math.round((combat + objectiveFocus + activity.matchRating) / 3),
            overall
          },
          situationalSignals: {
            clutchPotential: Math.round((combat + survival) / 2),
            entryPressure: combat,
            teamSupport: support,
            objectiveFocus,
            pressureHandling: Math.round((survival + activity.matchRating) / 2),
            tiltResistance: activity.reliabilityScore
          },
          summary: ["Strong role discipline.", "Reliable squad communication.", "Good pressure handling."],
          warnings: [],
          confidence: 0.82,
          source: "demo"
        })
      );
    }

    const otherUsers = users.filter((candidate) => String(candidate._id) !== String(user._id));
    for (const [index, teammate] of otherUsers.entries()) {
      const activity = activities[index % activities.length];
      if (!activity) continue;
      await TeammateFeedback.findOneAndUpdate(
        { sessionId: activity._id, fromUserId: user._id, toUserId: teammate._id },
        {
          $set: {
            ratings: {
              communication: 4 + (index % 2) * 0.5,
              teamwork: 4.5,
              reliability: 4.5,
              skill: 4,
              behavior: 5
            },
            wouldPlayAgain: "yes",
            comment: "Clear comms and reliable squad pacing.",
            skipped: false
          }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    const profile = await GamerProfile.findOne({ userId: user._id });
    const library = await SteamGame.find({ userId: user._id }).sort({ playtimeForeverMinutes: -1 }).limit(3);
    const gameProfiles = library.map((game, index) => ({
      gameSlug: (game.name || "").toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      gameName: game.name,
      minutes: game.playtimeForeverMinutes,
      sessions: 10 + index * 3,
      averageRating: 88 - index * 3,
      performance: {
        combat: 80 - index * 2,
        support: 86 - index,
        survival: 78 - index,
        objectiveFocus: 82 - index
      },
      roleSignal: index === 0 ? "Sentinel / Support" : "Flex"
    }));
    const teammateEdges = otherUsers.map((teammate, index) => ({
      userId: teammate._id,
      name: teammate.name,
      compatibility: 92 - index * 4,
      sharedGames: [profile.games?.[0]?.gameName || "Valorant"],
      reason: "Shared demo sessions, strong comms, and role balance."
    }));

    await GameplayGraph.findOneAndUpdate(
      { userId: user._id },
      {
        $set: {
          gameplayProfileScore: 82 + (user.email === "captain@clutchq.com" ? 5 : 0),
          confidence: 0.86,
          style: {
            mainStyle: profile.playstyleStats?.support >= profile.playstyleStats?.aggression ? "Structured support" : "Impact flex",
            competitiveTendency: 82,
            cooperativeTendency: 88,
            riskProfile: "Balanced",
            bestSquadFit: "Ranked squad with clear roles and comms"
          },
          gameProfiles,
          situationalStrengths: [
            { key: "teamSupport", label: "Team support", score: 88, evidence: "High teammate feedback and assist-heavy scorecards." },
            { key: "pressureHandling", label: "Pressure handling", score: 84, evidence: "Stable ratings in longer sessions." },
            { key: "objectiveFocus", label: "Objective focus", score: 81, evidence: "Consistent result and scorecard objective signals." }
          ],
          teammateEdges,
          recommendations: [
            "Best in structured ranked squads.",
            "Pair with an IGL or entry fragger.",
            "Keep sessions under 2.5h for best consistency."
          ],
          rhythmSummary: {
            totalMinutes: activities.reduce((sum, activity) => sum + activity.durationMinutes, 0),
            activeDays: 24,
            bestDayMinutes: 310,
            rhythmScore: 84
          },
          source: "demo",
          lastBuiltAt: new Date()
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }
};

const createLobbiesAndRequests = async (users) => {
  const byEmail = new Map(users.map((user) => [user.email, user]));
  const profiles = new Map();
  for (const user of users) {
    profiles.set(user.email, await GamerProfile.findOne({ userId: user._id }));
  }

  const lobbySeeds = [
    {
      title: "Valorant Gold/Plat Ranked Stack",
      ownerEmail: "captain@clutchq.com",
      game: "Valorant",
      rankMin: "Gold 1",
      rankMax: "Platinum 2",
      rankMinValue: 10,
      rankMaxValue: 15,
      neededPlayers: 5,
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
      rankMinValue: 10,
      rankMaxValue: 13,
      neededPlayers: 5,
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
      rankMinValue: 10,
      rankMaxValue: 13,
      neededPlayers: 3,
      neededRoles: ["Fragger", "Support"],
      mode: "casual",
      language: "English",
      description: "Chill ranked push with safe rotations and no rage comms."
    }
  ];

  const lobbies = [];
  for (const [index, seed] of lobbySeeds.entries()) {
    const owner = byEmail.get(seed.ownerEmail);
    const profile = profiles.get(seed.ownerEmail);
    const primaryGame = profile.games?.[0];
    lobbies.push(
      await Lobby.create({
        ...seed,
        ownerId: owner._id,
        region: "India",
        micRequired: true,
        currentMembers: [{ userId: owner._id, role: primaryGame?.roles?.[0] || "Flex", ready: true }],
        status: "open",
        startTime: new Date(Date.now() + (index + 1) * 45 * 60 * 1000),
        inviteCode: `DEMO${index + 1}`
      })
    );
  }

  const requestSeeds = [
    ["captain@clutchq.com", "demo@clutchq.com", null, "teammate", "pending", "Your Duelist/Flex pool fits tonight's ranked stack. Want to queue?"],
    ["demo@clutchq.com", "sentinel@clutchq.com", null, "teammate", "pending", "Need your Sentinel utility for a late ranked push."],
    ["demo@clutchq.com", null, lobbies[0], "lobby", "pending", "I can fill Duelist and keep comms clean for the Gold/Plat stack."],
    ["captain@clutchq.com", "sentinel@clutchq.com", null, "teammate", "pending", "Your anchor style fits our ranked tempo."],
    ["sentinel@clutchq.com", "flex@clutchq.com", null, "teammate", "accepted", "Let's keep Flex as utility support for scrims."]
  ];

  for (const [fromEmail, toEmail, lobby, type, status, message] of requestSeeds) {
    const request = await Request.create({
      fromUser: byEmail.get(fromEmail)._id,
      toUser: type === "lobby" ? lobby.ownerId : byEmail.get(toEmail)._id,
      lobbyId: lobby?._id,
      type,
      status,
      message
    });

    if (type === "lobby" && status === "pending") {
      await Lobby.findByIdAndUpdate(lobby._id, { $addToSet: { pendingRequests: request._id } });
    }
  }

  const demo = byEmail.get("demo@clutchq.com");
  for (const reviewerEmail of ["captain@clutchq.com", "sentinel@clutchq.com", "flex@clutchq.com"]) {
    await Review.create({
      reviewerId: byEmail.get(reviewerEmail)._id,
      reviewedUserId: demo._id,
      communication: 5,
      teamwork: 5,
      skill: 4,
      punctuality: 5,
      behavior: 5,
      comment: "Reliable teammate, clear comms, and ready for ranked queues."
    });
  }
};

const createActivityAndSteamData = async (users) => {
  const byEmail = new Map(users.map((user) => [user.email, user]));

  for (const account of demoAccounts) {
    const user = byEmail.get(account.email);
    const plan = activityPlans[account.email];
    const activities = [];

    for (let index = 0; index < 32; index += 1) {
      const [gameName, baseMinutes, baseRating] = plan[index % plan.length];
      const startedAt = new Date(Date.now() - (index + 1) * 36 * 60 * 60 * 1000 - (index % 4) * 60 * 60 * 1000);
      const durationMinutes = Math.max(38, baseMinutes + ((index % 5) - 2) * 12);
      const activity = await GameActivity.create({
        userId: user._id,
        gameSlug: gameSlugMap[gameName] || gameName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        gameName,
        source: "demo",
        startedAt,
        endedAt: new Date(startedAt.getTime() + durationMinutes * 60 * 1000),
        durationMinutes,
        status: "completed",
        result: index % 5 === 0 ? "loss" : index % 3 === 0 ? "completed" : "win",
        matchRating: Math.max(55, Math.min(96, baseRating + ((index % 7) - 3) * 2)),
        teamworkScore: 78 + (index % 15),
        communicationScore: 80 + (index % 12),
        reliabilityScore: 88 + (index % 8),
        performanceScore: 74 + (index % 17),
        notes: notes[index % notes.length]
      });
      activities.push(activity);

      if (index < 7) {
        await MatchAnalysis.create({
          userId: user._id,
          gameSlug: activity.gameSlug,
          gameName: activity.gameName,
          activityId: activity._id,
          category: ["Valorant", "CS2"].includes(activity.gameName) ? "FPS Tactical" : "Team Game",
          matchRating: activity.matchRating,
          teamworkScore: activity.teamworkScore,
          communicationScore: activity.communicationScore,
          reliabilityScore: activity.reliabilityScore,
          performanceScore: activity.performanceScore,
          trustImpact: Math.round((activity.matchRating - 70) / 5),
          highlights: ["Clear role discipline", "Good teammate pacing"],
          improvementAreas: activity.matchRating < 75 ? ["Tighter utility timing"] : ["Keep the same comms tempo"],
          sourceBreakdown: { source: "demo activity" }
        });
      }
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
    }
    await GamePlaytimeAggregate.insertMany([...aggregateMap.values()]);

    const steamId = steamIdByEmail[account.email];
    const library = steamLibraries[account.email];
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
      library.slice(0, 5).map(([appId, name], index) => ({
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
      }))
    );

    const friends = demoAccounts.filter((candidate) => candidate.email !== account.email);
    await SteamFriend.insertMany(
      friends.map((friend, index) => ({
        userId: user._id,
        steamId,
        friendSteamId: steamIdByEmail[friend.email],
        relationship: "friend",
        friendSince: new Date(Date.now() - (420 - index * 55) * 24 * 60 * 60 * 1000),
        displayName: friend.name,
        avatar: "/brand/clutchq-logo.png",
        profileUrl: `https://steamcommunity.com/id/clutchq-${friend.key}`,
        lastSyncedAt: new Date(),
        onClutchQ: true,
        clutchQUserId: byEmail.get(friend.email)._id
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
        achievements: 5,
        friends: friends.length,
        recentGames: library.filter((game) => game[3] > 0).length
      }
    });
  }
};

const run = async () => {
  await connectDB();
  const users = await upsertDemoUsers();
  await resetDemoOnlyCollections(users);
  await createLobbiesAndRequests(users);
  await createActivityAndSteamData(users);
  await createIntelligenceDemoData(users);

  console.log("Demo account seed complete.");
  console.log(`Seeded demo users: ${demoEmails.join(", ")}`);
  console.log("Password for each seeded demo user: demo123");
  await mongoose.connection.close();
};

run().catch(async (error) => {
  console.error(`Demo account seed failed: ${error.message}`);
  await mongoose.connection.close().catch(() => {});
  process.exit(1);
});
