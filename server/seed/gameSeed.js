import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import connectDB from "../config/db.js";
import User from "../models/User.js";
import GamerProfile from "../models/GamerProfile.js";
import Game from "../models/Game.js";
import GameRoom from "../models/GameRoom.js";
import GameActivity from "../models/GameActivity.js";
import GamePlaytimeAggregate from "../models/GamePlaytimeAggregate.js";
import MatchAnalysis from "../models/MatchAnalysis.js";
import { gameCatalog } from "../data/gameCatalog.js";
import { createDemoProfile, createProfilePayload, gamerNames, pick } from "../utils/seedData.js";

dotenv.config();
await connectDB();

const passwordHash = await bcrypt.hash("demo123", 10);

const ensureUser = async ({ name, email, role = "user" }) =>
  User.findOneAndUpdate(
    { email },
    {
      $setOnInsert: {
        name,
        email,
        passwordHash,
        role,
        avatar: "/clutchq-logo.svg",
        emailVerified: true,
        emailVerifiedAt: new Date()
      }
    },
    { new: true, upsert: true }
  );

const ensureProfile = async (user, index = 0) => {
  const existing = await GamerProfile.findOne({ userId: user._id });
  if (existing) {
    existing.clutchTag ||= `${user.name.replace(/\s+/g, "")}#${7291 + index}`;
    existing.playerCode ||= `CLQ-${user.name.replace(/[^a-z0-9]/gi, "").slice(0, 4).toUpperCase()}-${7291 + index}`;
    existing.gameHandles = existing.gameHandles || {};
    await existing.save();
    return existing;
  }

  const payload = user.email === "demo@clutchq.com" ? createDemoProfile(user._id) : createProfilePayload(user._id, user.name, index);
  payload.clutchTag = `${user.name.replace(/\s+/g, "")}#${7291 + index}`;
  payload.playerCode = `CLQ-${user.name.replace(/[^a-z0-9]/gi, "").slice(0, 4).toUpperCase()}-${7291 + index}`;
  payload.gameHandles = {
    valorant: user.name,
    discord: `${user.name.toLowerCase()}#${1000 + index}`
  };

  return GamerProfile.create(payload);
};

const demo = await ensureUser({ name: "Abhijeet", email: "demo@clutchq.com" });
await ensureUser({ name: "ClutchQ Admin", email: "admin@clutchq.com", role: "admin" });

const users = [demo];
for (let index = 0; index < Math.min(56, gamerNames.length); index += 1) {
  users.push(await ensureUser({ name: gamerNames[index], email: `${gamerNames[index].toLowerCase()}@clutchq.gg` }));
}

const profiles = [];
for (const [index, user] of users.entries()) {
  profiles.push(await ensureProfile(user, index));
}

const games = [];
for (const game of gameCatalog) {
  games.push(
    await Game.findOneAndUpdate(
      { slug: game.slug },
      {
        $set: {
          ...game,
          active: true
        }
      },
      { new: true, upsert: true }
    )
  );
}

const roomModes = ["Ranked Push", "Open Lobby", "Casual Chill", "Mic Required", "Beginner Friendly", "Competitive", "Custom Party"];
const regions = ["India", "SEA", "EU", "NA", "Middle East"];
const languages = ["English", "Hindi", "Tamil", "Spanish", "Arabic"];

for (let index = 0; index < 84; index += 1) {
  const game = games[index % games.length];
  const hostProfile = profiles[(index + 1) % profiles.length];
  const hostUserId = hostProfile.userId;
  const title = `${game.title} ${pick(roomModes, index)} #${index + 1}`;
  const existing = await GameRoom.findOne({ title, gameSlug: game.slug });

  if (existing) continue;

  const members = [
    {
      userId: hostUserId,
      role: pick(game.roles || ["Flex"], index),
      joinedAt: new Date(Date.now() - index * 60000),
      ready: index % 2 === 0,
      status: "joined"
    }
  ];

  if (index % 3 !== 0) {
    members.push({
      userId: profiles[(index + 7) % profiles.length].userId,
      role: pick(game.roles || ["Support"], index, 2),
      joinedAt: new Date(Date.now() - index * 50000),
      ready: index % 4 === 0,
      status: "joined"
    });
  }

  await GameRoom.create({
    gameId: game._id,
    gameSlug: game.slug,
    title,
    hostId: hostUserId,
    mode: pick(roomModes, index),
    region: pick(regions, index),
    language: pick(languages, index),
    rankMin: pick(["Bronze 1", "Silver 2", "Gold 1", "Platinum 1", "Diamond 1"], index),
    rankMax: pick(["Gold 3", "Platinum 2", "Diamond 2", "Ascendant 1", "Immortal 1"], index),
    micRequired: index % 4 !== 0,
    maxMembers: game.teamSize || 5,
    currentMembers: members,
    neededRoles: (game.roles || ["Flex"]).slice(0, Math.min(3, game.roles?.length || 1)),
    tags: [pick(["Rank Push", "Mic Ready", "Chill", "Scrim", "No Toxicity"], index), game.category],
    status: index % 8 === 0 ? "starting" : index % 13 === 0 ? "in_game" : "open",
    trustRequirement: 55 + (index % 30),
    startsAt: new Date(Date.now() + (index + 1) * 15 * 60000)
  });
}

for (let index = 0; index < 120; index += 1) {
  const profile = profiles[index % profiles.length];
  const game = games[index % games.length];
  const startedAt = new Date(Date.now() - (index + 1) * 5 * 60 * 60000);
  const durationMinutes = 35 + (index % 95);
  const endedAt = new Date(startedAt.getTime() + durationMinutes * 60000);
  const existing = await GameActivity.findOne({ userId: profile.userId, gameSlug: game.slug, startedAt });

  if (existing) continue;

  const teamworkScore = 62 + (index % 35);
  const communicationScore = 60 + ((index + 7) % 35);
  const performanceScore = 58 + ((index + 11) % 36);
  const reliabilityScore = 80 + (index % 16);
  const matchRating = Math.round(teamworkScore * 0.3 + communicationScore * 0.25 + reliabilityScore * 0.2 + performanceScore * 0.15 + 10);
  const activity = await GameActivity.create({
    userId: profile.userId,
    gameId: game._id,
    gameSlug: game.slug,
    gameName: game.title,
    source: "manual",
    startedAt,
    endedAt,
    durationMinutes,
    status: "completed",
    result: pick(["win", "loss", "completed", "unknown"], index),
    matchRating,
    teamworkScore,
    communicationScore,
    reliabilityScore,
    performanceScore,
    notes: "Seeded game session for activity and leaderboard demos."
  });

  await GamePlaytimeAggregate.findOneAndUpdate(
    { userId: profile.userId, gameSlug: game.slug },
    {
      $setOnInsert: {
        userId: profile.userId,
        gameSlug: game.slug,
        gameName: game.title
      },
      $inc: {
        totalMinutes: durationMinutes,
        weeklyMinutes: index < 35 ? durationMinutes : 0,
        monthlyMinutes: index < 80 ? durationMinutes : 0,
        sessionsCount: 1
      },
      $max: { lastPlayedAt: endedAt }
    },
    { upsert: true, new: true }
  );

  if (index < 36) {
    await MatchAnalysis.findOneAndUpdate(
      { activityId: activity._id },
      {
        $set: {
          userId: profile.userId,
          gameSlug: game.slug,
          gameName: game.title,
          activityId: activity._id,
          category: game.category,
          matchRating,
          teamworkScore,
          communicationScore,
          reliabilityScore,
          performanceScore,
          trustImpact: Math.round((matchRating - 70) / 5),
          highlights: ["Session completed", "Useful comms", "Reliable queue behavior"],
          improvementAreas: ["Keep improving role timing"],
          sourceBreakdown: {
            teamwork: "seeded rating",
            communication: "seeded rating",
            reliability: "completed session",
            performance: "seeded rating"
          }
        }
      },
      { upsert: true }
    );
  }
}

const [gameCount, roomCount, activityCount, aggregateCount, analysisCount] = await Promise.all([
  Game.countDocuments(),
  GameRoom.countDocuments(),
  GameActivity.countDocuments(),
  GamePlaytimeAggregate.countDocuments(),
  MatchAnalysis.countDocuments()
]);

console.log("ClutchQ game seed complete");
console.log(`Games: ${gameCount}`);
console.log(`Game rooms: ${roomCount}`);
console.log(`Activities: ${activityCount}`);
console.log(`Playtime aggregates: ${aggregateCount}`);
console.log(`Match analyses: ${analysisCount}`);
process.exit(0);
