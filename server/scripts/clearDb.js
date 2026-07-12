import dotenv from "dotenv";
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
import GameRoom from "../models/GameRoom.js";
import GameplayGraph from "../models/GameplayGraph.js";
import MatchAnalysis from "../models/MatchAnalysis.js";
import ScorecardAnalysis from "../models/ScorecardAnalysis.js";
import ScorecardUpload from "../models/ScorecardUpload.js";
import SteamAchievement from "../models/SteamAchievement.js";
import SteamFriend from "../models/SteamFriend.js";
import SteamGame from "../models/SteamGame.js";
import SteamSyncLog from "../models/SteamSyncLog.js";
import TeammateFeedback from "../models/TeammateFeedback.js";
import OtpToken from "../models/OtpToken.js";
import PasswordResetSession from "../models/PasswordResetSession.js";
import OAuthLoginCode from "../models/OAuthLoginCode.js";
import { assertDestructiveScriptAllowed } from "../utils/scriptSafety.js";
import { cleanupDiscordChannelsBeforeDelete } from "../utils/scriptDiscordCleanup.js";

dotenv.config();
assertDestructiveScriptAllowed("ALLOW_DATABASE_CLEAR", "Database clearing");
await connectDB();

const [existingLobbyDiscord, existingRoomDiscord] = await Promise.all([
  Lobby.find({ "discord.channelId": { $exists: true, $ne: "" } }).select("discord.channelId"),
  GameRoom.find({ "discord.channelId": { $exists: true, $ne: "" } }).select("discord.channelId")
]);
await cleanupDiscordChannelsBeforeDelete(
  [...existingLobbyDiscord, ...existingRoomDiscord],
  "Database clearing"
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
  GameRoom.deleteMany({}),
  GameplayGraph.deleteMany({}),
  MatchAnalysis.deleteMany({}),
  ScorecardAnalysis.deleteMany({}),
  ScorecardUpload.deleteMany({}),
  SteamAchievement.deleteMany({}),
  SteamFriend.deleteMany({}),
  SteamGame.deleteMany({}),
  SteamSyncLog.deleteMany({}),
  TeammateFeedback.deleteMany({}),
  OtpToken.deleteMany({}),
  PasswordResetSession.deleteMany({}),
  OAuthLoginCode.deleteMany({})
]);

console.log("ClutchQ database cleared");
process.exit(0);
