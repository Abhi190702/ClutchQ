import crypto from "crypto";
import GameActivity from "../models/GameActivity.js";
import GamerProfile from "../models/GamerProfile.js";
import Lobby from "../models/Lobby.js";
import MatchAnalysis from "../models/MatchAnalysis.js";
import Review from "../models/Review.js";
import Session from "../models/Session.js";
import SteamAchievement from "../models/SteamAchievement.js";
import SteamFriend from "../models/SteamFriend.js";
import SteamGame from "../models/SteamGame.js";
import SteamSyncLog from "../models/SteamSyncLog.js";
import User from "../models/User.js";
import { demoSteamAchievements, demoSteamFriends, demoSteamGames, demoSteamIdentity } from "../data/demoSteamData.js";
import { ExternalRequestTimeoutError, fetchWithTimeout } from "../utils/fetchWithTimeout.js";
import { isSharedDemoUser } from "../utils/demoAccounts.js";

const STEAM_API = "https://api.steampowered.com";
const STEAM_OPENID = "https://steamcommunity.com/openid/login";

export class SteamServiceError extends Error {
  constructor(message, statusCode = 502, section = "steam") {
    super(message);
    this.name = "SteamServiceError";
    this.statusCode = statusCode;
    this.section = section;
  }
}

const demoIdentityByEmail = {
  "demo@clutchq.com": { steamId: "76561199000072910", displayName: "Abhijeet", level: 42 },
  "captain@clutchq.com": { steamId: "76561199000072911", displayName: "CaptainRex", level: 56 },
  "sentinel@clutchq.com": { steamId: "76561199000072912", displayName: "NovaSentinel", level: 38 },
  "flex@clutchq.com": { steamId: "76561199000072913", displayName: "FlexByte", level: 34 }
};
const isDemoUser = isSharedDemoUser;
const getDemoIdentity = (user) => ({
  ...demoSteamIdentity,
  ...(demoIdentityByEmail[String(user?.email || "").toLowerCase()] || {}),
  avatar: user?.avatar || demoSteamIdentity.avatar,
  profileUrl: `https://steamcommunity.com/id/clutchq-${String(user?.email || "demo").split("@")[0]}`
});
const minutesToHours = (minutes = 0) => Math.round((minutes / 60) * 10) / 10;
const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, Math.round(value)));
const getApiKey = () => String(process.env.STEAM_API_KEY || "").trim();
const cleanExternalText = (value, maxLength) =>
  String(value || "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
const cleanExternalUrl = (value) => {
  const text = String(value || "").trim().slice(0, 600);
  try {
    const parsed = new URL(text);
    return ["http:", "https:"].includes(parsed.protocol) ? parsed.toString() : "";
  } catch {
    return "";
  }
};
const pushUnique = (items, value) => {
  if (value && !items.includes(value)) items.push(value);
};

const steamImage = (appId, hash) => (hash ? `https://media.steampowered.com/steamcommunity/public/images/apps/${appId}/${hash}.jpg` : "");

const steamFetch = async (path, params = {}) => {
  if (!getApiKey()) throw new SteamServiceError("Steam API key is not configured.", 500);
  const url = new URL(`${STEAM_API}/${path}`);
  Object.entries({ key: getApiKey(), format: "json", ...params }).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, value);
  });

  let response;
  try {
    response = await fetchWithTimeout(url);
  } catch (error) {
    if (error instanceof ExternalRequestTimeoutError) {
      throw new SteamServiceError("Steam API request timed out. Try again later.", 504);
    }
    throw error;
  }
  if (!response.ok) {
    if ([401, 403].includes(response.status)) {
      throw new SteamServiceError("Steam data is private or unavailable.", 200);
    }
    throw new SteamServiceError("Steam API request failed. Try again later.", response.status);
  }

  try {
    return await response.json();
  } catch {
    throw new SteamServiceError("Steam API returned an invalid response. Try again later.", 502);
  }
};

export const getPlayerSummary = async (steamId) => {
  const data = await steamFetch("ISteamUser/GetPlayerSummaries/v0002/", { steamids: steamId });
  const player = data?.response?.players?.[0];
  if (!player) throw new SteamServiceError("Steam profile is unavailable.", 200, "profile");
  return player;
};

export const getOwnedGames = async (steamId) => {
  const data = await steamFetch("IPlayerService/GetOwnedGames/v0001/", {
    steamid: steamId,
    include_appinfo: true,
    include_played_free_games: true
  });
  const response = data?.response;
  if (!response || (!Array.isArray(response.games) && !Number.isFinite(Number(response.game_count)))) {
    throw new SteamServiceError("Steam library is private or unavailable.", 200, "library");
  }
  return Array.isArray(response.games) ? response.games : [];
};

export const getRecentlyPlayedGames = async (steamId) => {
  const data = await steamFetch("IPlayerService/GetRecentlyPlayedGames/v0001/", { steamid: steamId, count: 20 });
  const response = data?.response;
  if (!response || (!Array.isArray(response.games) && !Number.isFinite(Number(response.total_count)))) {
    throw new SteamServiceError("Steam recent activity is private or unavailable.", 200, "recent activity");
  }
  return Array.isArray(response.games) ? response.games : [];
};

export const getSteamLevel = async (steamId) => {
  const data = await steamFetch("IPlayerService/GetSteamLevel/v1/", { steamid: steamId });
  if (data?.response?.player_level === undefined) {
    throw new SteamServiceError("Steam level is private or unavailable.", 200, "level");
  }
  return Number(data.response.player_level) || 0;
};

export const getBadges = async (steamId) => {
  const data = await steamFetch("IPlayerService/GetBadges/v1/", { steamid: steamId });
  return data?.response?.badges || [];
};

export const getFriendList = async (steamId) => {
  const data = await steamFetch("ISteamUser/GetFriendList/v0001/", { steamid: steamId, relationship: "friend" });
  if (!data?.friendslist || !Array.isArray(data.friendslist.friends)) {
    throw new SteamServiceError("Steam friends are private or unavailable.", 200, "friends");
  }
  return data.friendslist.friends;
};

export const getPlayerAchievements = async (steamId, appId) => {
  const data = await steamFetch("ISteamUserStats/GetPlayerAchievements/v0001/", { steamid: steamId, appid: appId, l: "en" });
  if (data?.playerstats?.success !== true || !Array.isArray(data.playerstats.achievements)) {
    throw new SteamServiceError("Steam achievements are private or unavailable.", 200, "achievements");
  }
  return data.playerstats.achievements;
};

export const getSteamProvider = (user) => user?.authProviders?.steam || null;
const shouldUseDemoSteamData = (user) => isDemoUser(user) && !getSteamProvider(user)?.steamId;
const steamDataQueryForUser = (user) => {
  const provider = getSteamProvider(user);
  return provider?.steamId ? { userId: user._id, steamId: provider.steamId } : { userId: user._id };
};

export const removeStaleSteamAccountData = async (userId, activeSteamId) => {
  if (!userId || !activeSteamId) return;
  const staleFilter = { userId, steamId: { $ne: activeSteamId } };
  await Promise.all([
    SteamGame.deleteMany(staleFilter),
    SteamAchievement.deleteMany(staleFilter),
    SteamFriend.deleteMany(staleFilter),
    SteamSyncLog.deleteMany(staleFilter)
  ]);
};

const normalizeUrlValue = (value) => {
  if (!value) return null;
  const trimmed = String(value).trim().replace(/\/$/, "");
  if (!trimmed) return null;

  let fixed = trimmed;
  fixed = fixed.replace(/^https:\/\/https\/\//i, "https://");
  fixed = fixed.replace(/^http:\/\/http\/\//i, "http://");
  fixed = fixed.replace(/^https\/\//i, "https://");
  fixed = fixed.replace(/^http\/\//i, "http://");
  fixed = fixed.startsWith("https:") && !fixed.startsWith("https://") ? fixed.replace("https:", "https://") : fixed;
  fixed = fixed.startsWith("http:") && !fixed.startsWith("http://") ? fixed.replace("http:", "http://") : fixed;

  try {
    const url = new URL(fixed);
    if (!["http:", "https:"].includes(url.protocol) || !url.hostname) return null;
    if (["http", "https"].includes(url.hostname.toLowerCase())) return null;
    return url;
  } catch {
    return null;
  }
};

const getServerOrigin = () =>
  normalizeUrlValue(process.env.SERVER_URL)?.origin ||
  normalizeUrlValue(process.env.RENDER_EXTERNAL_URL)?.origin ||
  "http://localhost:5000";

const getSteamCallbackUrl = () => {
  const configured = normalizeUrlValue(process.env.STEAM_CALLBACK_URL);
  if (configured) return configured;

  return new URL("/api/auth/steam/callback", getServerOrigin());
};

const getSteamRealm = (callbackUrl) => {
  const configured = normalizeUrlValue(process.env.STEAM_REALM);
  return configured?.origin || callbackUrl.origin;
};

export const buildSteamAuthUrl = ({ state } = {}) => {
  const callbackUrl = getSteamCallbackUrl();
  if (state) callbackUrl.searchParams.set("state", state);

  const params = new URLSearchParams({
    "openid.ns": "http://specs.openid.net/auth/2.0",
    "openid.mode": "checkid_setup",
    "openid.return_to": callbackUrl.toString(),
    "openid.realm": getSteamRealm(callbackUrl),
    "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
    "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select"
  });

  return `${STEAM_OPENID}?${params.toString()}`;
};

export const verifySteamOpenId = async (query) => {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (key.startsWith("openid.") && typeof value === "string" && key.length <= 80 && value.length <= 2000) {
      params.set(key, value);
    }
  });
  if (!params.get("openid.claimed_id") || !params.get("openid.sig")) {
    throw new SteamServiceError("Steam OpenID response is incomplete.", 401);
  }
  params.set("openid.mode", "check_authentication");

  const response = await fetchWithTimeout(STEAM_OPENID, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params
  });

  if (!response.ok) throw new SteamServiceError("Steam OpenID verification failed.", 401);
  const text = await response.text();
  if (!text.includes("is_valid:true")) throw new SteamServiceError("Steam login could not be verified.", 401);

  const claimedId = query["openid.claimed_id"] || query["openid.identity"] || "";
  const match = String(claimedId).match(/\/id\/(\d{17})$/);
  if (!match) throw new SteamServiceError("SteamID was not returned by Steam.", 401);
  return match[1];
};

const toSteamGameDoc = (userId, steamId, game, recentByApp = new Map(), recentAvailable = true) => {
  const recent = recentByApp.get(Number(game.appid));
  const document = {
    userId,
    steamId,
    appId: Number(game.appid),
    name: cleanExternalText(game.name, 200),
    iconUrl: steamImage(game.appid, game.img_icon_url),
    logoUrl: steamImage(game.appid, game.img_logo_url),
    playtimeForeverMinutes: Number(game.playtime_forever || 0),
    lastPlayedAt: game.rtime_last_played ? new Date(Number(game.rtime_last_played) * 1000) : undefined,
    hasCommunityVisibleStats: game.has_community_visible_stats,
    source: "steam",
    lastSyncedAt: new Date()
  };
  if (recentAvailable) {
    document.playtimeLastTwoWeeksMinutes = Number(recent?.playtime_2weeks || game.playtime_2weeks || 0);
  }
  return document;
};

const upsertSteamGames = async (userId, steamId, games, recentGames = [], recentAvailable = true) => {
  const recentByApp = new Map(recentGames.map((game) => [Number(game.appid), game]));
  const docs = games
    .map((game) => toSteamGameDoc(userId, steamId, game, recentByApp, recentAvailable))
    .filter((game) => game.appId && game.name);

  if (docs.length) {
    await SteamGame.bulkWrite(
      docs.map((doc) => ({
        updateOne: {
          filter: { userId, appId: doc.appId },
          update: { $set: doc },
          upsert: true
        }
      })),
      { ordered: false }
    );
  }

  return docs.length;
};

const upsertSteamFriends = async (userId, steamId, friends, summaries = []) => {
  const summaryById = new Map(summaries.map((item) => [String(item.steamid), item]));
  const clutchUsers = await User.find({ "authProviders.steam.steamId": { $in: friends.map((friend) => String(friend.steamid)) } }).select("_id authProviders.steam.steamId");
  const clutchBySteam = new Map(clutchUsers.map((user) => [String(user.authProviders?.steam?.steamId), user]));

  await Promise.all(
    friends.map((friend) => {
      const summary = summaryById.get(String(friend.steamid));
      const clutchUser = clutchBySteam.get(String(friend.steamid));
      return SteamFriend.findOneAndUpdate(
        { userId, friendSteamId: String(friend.steamid) },
        {
          $set: {
            userId,
            steamId,
            friendSteamId: String(friend.steamid),
            relationship: friend.relationship,
            friendSince: friend.friend_since ? new Date(Number(friend.friend_since) * 1000) : undefined,
            displayName: cleanExternalText(summary?.personaname || `Steam ${String(friend.steamid).slice(-4)}`, 200),
            avatar: cleanExternalUrl(summary?.avatarfull || summary?.avatarmedium),
            profileUrl: cleanExternalUrl(summary?.profileurl),
            lastSyncedAt: new Date(),
            onClutchQ: Boolean(clutchUser),
            clutchQUserId: clutchUser?._id
          }
        },
        { new: true, upsert: true }
      );
    })
  );

  return friends.length;
};

const upsertAchievements = async (userId, steamId, games) => {
  let count = 0;
  const topGames = games
    .filter((game) => game.appId && game.playtimeForeverMinutes)
    .sort((a, b) => (b.playtimeLastTwoWeeksMinutes || b.playtimeForeverMinutes) - (a.playtimeLastTwoWeeksMinutes || a.playtimeForeverMinutes))
    .slice(0, 5);

  for (const game of topGames) {
    try {
      const achievements = await getPlayerAchievements(steamId, game.appId);
      const cleanAchievements = achievements.filter((achievement) => achievement?.apiname).slice(0, 1000);
      if (cleanAchievements.length) {
        await SteamAchievement.bulkWrite(
          cleanAchievements.map((achievement) => ({
            updateOne: {
              filter: { userId, appId: game.appId, achievementName: achievement.apiname },
              update: {
                $set: {
                  userId,
                  steamId,
                  appId: game.appId,
                  gameName: cleanExternalText(game.name, 200),
                  achievementName: cleanExternalText(achievement.apiname, 200),
                  displayName: cleanExternalText(achievement.name || achievement.apiname, 240),
                  description: cleanExternalText(achievement.description, 1200),
                  icon: cleanExternalUrl(achievement.icon),
                  iconGray: cleanExternalUrl(achievement.icongray),
                  achieved: Boolean(achievement.achieved),
                  unlockTime: achievement.unlocktime ? new Date(Number(achievement.unlocktime) * 1000) : undefined,
                  lastSyncedAt: new Date()
                }
              },
              upsert: true
            }
          })),
          { ordered: false }
        );
      }
      // A successful empty response is authoritative. Privacy/unavailable
      // responses throw above and land in catch, where existing cache is kept.
      await SteamAchievement.deleteMany({
        userId,
        appId: game.appId,
        achievementName: { $nin: cleanAchievements.map((achievement) => achievement.apiname) }
      });
      count += cleanAchievements.length;
    } catch {
      // Achievements are often private or unavailable per game; keep the rest of the sync healthy.
    }
  }

  return count;
};

const performSteamSyncForUser = async (user) => {
  const provider = getSteamProvider(user);
  if (!provider?.steamId) throw new SteamServiceError("Connect Steam before syncing.", 400);
  if (!getApiKey()) throw new SteamServiceError("Steam API key is not configured.", 503);

  await SteamSyncLog.updateMany(
    {
      userId: user._id,
      status: "running",
      startedAt: { $lt: new Date(Date.now() - 5 * 60 * 1000) }
    },
    {
      $set: {
        status: "failed",
        message: "Previous Steam sync did not finish.",
        finishedAt: new Date()
      }
    }
  );

  let log;
  try {
    log = await SteamSyncLog.create({
      userId: user._id,
      steamId: provider.steamId,
      syncType: "full",
      status: "running"
    });
  } catch (error) {
    if (error?.code === 11000) {
      throw new SteamServiceError("A Steam sync is already running for this account.", 409);
    }
    throw error;
  }
  const privateSections = [];
  const warnings = [];
  const counts = { games: 0, achievements: 0, friends: 0, recentGames: 0 };

  try {
    const [summaryResult, levelResult, gamesResult, recentResult, friendsResult] = await Promise.allSettled([
      getPlayerSummary(provider.steamId),
      getSteamLevel(provider.steamId),
      getOwnedGames(provider.steamId),
      getRecentlyPlayedGames(provider.steamId),
      getFriendList(provider.steamId)
    ]);

    const summary = summaryResult.status === "fulfilled" ? summaryResult.value : null;
    const level = levelResult.status === "fulfilled" ? levelResult.value : undefined;
    const games = gamesResult.status === "fulfilled" ? gamesResult.value : [];
    const recentGames = recentResult.status === "fulfilled" ? recentResult.value : [];
    const friends = friendsResult.status === "fulfilled" ? friendsResult.value : [];

    const coreResults = [summaryResult, gamesResult, recentResult, friendsResult];
    const coreFailures = coreResults.filter((result) => result.status === "rejected");
    if (coreFailures.length === coreResults.length) {
      const actionableFailure = coreFailures.find((result) => result.reason?.statusCode !== 200);
      if (actionableFailure) throw actionableFailure.reason;
      throw new SteamServiceError(
        "Steam denied every data request. Verify STEAM_API_KEY and the account's privacy settings.",
        502
      );
    }

    if (summaryResult.status === "rejected") pushUnique(privateSections, "profile");
    if (levelResult.status === "rejected") pushUnique(privateSections, "level");

    if (gamesResult.status === "rejected") {
      pushUnique(privateSections, "library");
    }

    if (recentResult.status === "rejected") {
      pushUnique(privateSections, "recent activity");
    }

    if (friendsResult.status === "rejected") {
      pushUnique(privateSections, "friends");
    }

    user.authProviders = {
      ...(user.authProviders?.toObject?.() || user.authProviders || {}),
      steam: {
        ...provider,
        displayName: summary?.personaname || provider.displayName,
        avatar: summary?.avatarfull || provider.avatar,
        profileUrl: summary?.profileurl || provider.profileUrl,
        level: levelResult.status === "fulfilled" ? level : provider.level,
        lastSyncedAt: new Date()
      }
    };
    await user.save();

    counts.games = await upsertSteamGames(
      user._id,
      provider.steamId,
      games,
      recentGames,
      recentResult.status === "fulfilled"
    );
    counts.recentGames = recentGames.length;
    if (gamesResult.status === "fulfilled") {
      const currentAppIds = games.map((game) => Number(game.appid)).filter(Boolean);
      await SteamGame.deleteMany({
        userId: user._id,
        steamId: provider.steamId,
        appId: { $nin: currentAppIds }
      });
      await SteamAchievement.deleteMany({
        userId: user._id,
        steamId: provider.steamId,
        appId: { $nin: currentAppIds }
      });
    }

    if (friendsResult.status === "fulfilled") {
      const visibleFriends = friends.slice(0, 80);
      const friendIds = visibleFriends.map((friend) => friend.steamid).join(",");
      let friendSummaries = [];
      if (friendIds) {
        try {
          const data = await steamFetch("ISteamUser/GetPlayerSummaries/v0002/", { steamids: friendIds });
          friendSummaries = data?.response?.players || [];
        } catch {
          pushUnique(privateSections, "friend profiles");
        }
      }
      counts.friends = await upsertSteamFriends(user._id, provider.steamId, visibleFriends, friendSummaries);
      await SteamFriend.deleteMany({
        userId: user._id,
        steamId: provider.steamId,
        friendSteamId: { $nin: visibleFriends.map((friend) => String(friend.steamid)) }
      });
    }

    const storedGames = await SteamGame.find({ userId: user._id, steamId: provider.steamId }).sort({ playtimeForeverMinutes: -1 }).limit(10);
    counts.achievements = await upsertAchievements(user._id, provider.steamId, storedGames);

    if (storedGames.length && !counts.achievements) {
      warnings.push("Steam achievements were unavailable for the synced top games.");
    }

    log.status = privateSections.length || warnings.length ? "partial" : "success";
    log.message = privateSections.length || warnings.length ? "Steam synced with some unavailable sections." : "Steam synced successfully.";
    log.privateSections = privateSections;
    log.warnings = warnings;
    log.counts = counts;
    log.finishedAt = new Date();
    await log.save();

    return { counts, privateSections, warnings, message: log.message };
  } catch (error) {
    log.status = "failed";
    log.message = error.message || "Steam sync failed.";
    log.privateSections = privateSections;
    log.warnings = warnings;
    log.counts = counts;
    log.finishedAt = new Date();
    await log.save().catch(() => {});
    throw error;
  }
};

const steamSyncsInFlight = new Map();

export const syncSteamForUser = async (user) => {
  const key = String(user?._id || "");
  if (!key) throw new SteamServiceError("Steam user is invalid.", 400);
  if (steamSyncsInFlight.has(key)) return steamSyncsInFlight.get(key);

  const operation = performSteamSyncForUser(user);
  steamSyncsInFlight.set(key, operation);
  try {
    return await operation;
  } finally {
    if (steamSyncsInFlight.get(key) === operation) steamSyncsInFlight.delete(key);
  }
};

export const getSteamIdentityForUser = async (user) => {
  if (shouldUseDemoSteamData(user)) return getDemoIdentity(user);
  const provider = getSteamProvider(user);
  if (!provider?.steamId) return { connected: false };
  const lastLog = await SteamSyncLog.findOne({ userId: user._id }).sort({ startedAt: -1 });

  return {
    connected: true,
    steamId: provider.steamId,
    displayName: provider.displayName,
    avatar: provider.avatar,
    profileUrl: provider.profileUrl,
    level: provider.level,
    lastSyncedAt: provider.lastSyncedAt || provider.connectedAt,
    privacyStatus: lastLog?.privateSections?.length ? `Private: ${lastLog.privateSections.join(", ")}` : "Public or partially public",
    syncStatus: lastLog?.status || "never_synced",
    syncMessage: lastLog?.message,
    warnings: lastLog?.warnings || [],
    privateSections: lastLog?.privateSections || []
  };
};

export const getSteamLibraryForUser = async (user) => {
  const query = steamDataQueryForUser(user);
  if (shouldUseDemoSteamData(user) && !(await SteamGame.exists(query))) return demoSteamGames;
  return SteamGame.find(query).sort({ playtimeForeverMinutes: -1 }).limit(200);
};

export const getSteamRecentForUser = async (user) => {
  const library = await getSteamLibraryForUser(user);
  const recentCutoff = Date.now() - 14 * 24 * 60 * 60 * 1000;
  return library
    .filter((game) => game.playtimeLastTwoWeeksMinutes > 0 || (game.lastPlayedAt && new Date(game.lastPlayedAt).getTime() >= recentCutoff))
    .sort((a, b) => (b.playtimeLastTwoWeeksMinutes || 0) - (a.playtimeLastTwoWeeksMinutes || 0))
    .slice(0, 12);
};

export const getSteamAchievementsForUser = async (user) => {
  const query = steamDataQueryForUser(user);
  if (shouldUseDemoSteamData(user) && !(await SteamAchievement.exists(query))) return demoSteamAchievements;
  return SteamAchievement.find(query).sort({ achieved: -1, unlockTime: -1 }).limit(300);
};

export const getSteamFriendsForUser = async (user) => {
  const query = steamDataQueryForUser(user);
  if (shouldUseDemoSteamData(user) && !(await SteamFriend.exists(query))) return demoSteamFriends;
  return SteamFriend.find(query).sort({ onClutchQ: -1, displayName: 1 }).limit(80);
};

export const getSteamSyncStatusForUser = async (user) => {
  const provider = getSteamProvider(user);
  if (!provider?.steamId) {
    return shouldUseDemoSteamData(user)
      ? { connected: false, demo: true, status: "demo", message: "Showing demo Steam data until a real Steam account is connected." }
      : { connected: false, status: "not_connected", message: "Connect Steam before syncing." };
  }

  const [lastLog, games, achievements, friends] = await Promise.all([
    SteamSyncLog.findOne({ userId: user._id, steamId: provider.steamId }).sort({ startedAt: -1 }),
    SteamGame.countDocuments({ userId: user._id, steamId: provider.steamId }),
    SteamAchievement.countDocuments({ userId: user._id, steamId: provider.steamId }),
    SteamFriend.countDocuments({ userId: user._id, steamId: provider.steamId })
  ]);

  return {
    connected: true,
    steamId: provider.steamId,
    status: lastLog?.status || "never_synced",
    message: lastLog?.message || "Steam connected. Run Sync Steam to import your public Steam data.",
    lastSyncedAt: lastLog?.finishedAt || provider.lastSyncedAt || provider.connectedAt,
    counts: lastLog?.counts || { games, achievements, friends, recentGames: 0 },
    storedCounts: { games, achievements, friends },
    privateSections: lastLog?.privateSections || [],
    warnings: lastLog?.warnings || []
  };
};

export const getFavoriteGamesForUser = async (user) => {
  const library = await getSteamLibraryForUser(user);
  const sorted = [...library].sort((a, b) => (b.playtimeForeverMinutes || 0) - (a.playtimeForeverMinutes || 0));
  const recent = [...library]
    .filter((game) => (game.playtimeLastTwoWeeksMinutes || 0) > 0)
    .sort((a, b) => (b.playtimeLastTwoWeeksMinutes || 0) - (a.playtimeLastTwoWeeksMinutes || 0));
  const dormant = sorted.find((game) => (game.playtimeForeverMinutes || 0) > 600 && (!game.lastPlayedAt || new Date(game.lastPlayedAt) < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)));
  const competitive = sorted.find((game) => /counter|apex|dota|league|valorant|rainbow|finals|pubg|warzone/i.test(game.name));
  const coop = sorted.find((game) => /lethal|helldivers|stardew|terraria|minecraft|overcooked|phasmo/i.test(game.name));

  return [
    { label: "Main Game", game: sorted[0], reason: `${minutesToHours(sorted[0]?.playtimeForeverMinutes)}h total playtime` },
    { label: "Recent Obsession", game: recent[0], reason: `${minutesToHours(recent[0]?.playtimeLastTwoWeeksMinutes)}h in the last two weeks` },
    { label: "Competitive Game", game: competitive || sorted[1], reason: "Best fit for ranked squads" },
    { label: "Co-op Game", game: coop || sorted[2], reason: "Best fit for coordinated party sessions" },
    { label: "Dormant Game", game: dormant || sorted.at(-1), reason: "High history, worth revisiting" }
  ].filter((item) => item.game);
};

const addHeatDay = (map, date, gameName, minutes) => {
  const parsedDate = new Date(date);
  const safeMinutes = Math.max(0, Number(minutes) || 0);
  if (Number.isNaN(parsedDate.getTime()) || safeMinutes <= 0) return;
  const key = parsedDate.toISOString().slice(0, 10);
  const day = map.get(key) || { date: key, totalMinutes: 0, games: [] };
  day.totalMinutes += safeMinutes;
  const existing = day.games.find((game) => game.gameName === gameName);
  if (existing) existing.minutes += safeMinutes;
  else day.games.push({ gameName, minutes: safeMinutes });
  map.set(key, day);
};

export const getHeatmapForUser = async (user) => {
  const map = new Map();
  const activities = await GameActivity.find({ userId: user._id, status: "completed" }).sort({ endedAt: -1 }).limit(200);

  activities.forEach((activity) => {
    addHeatDay(map, activity.endedAt || activity.startedAt || activity.createdAt, activity.gameName || activity.gameSlug || "ClutchQ Session", activity.durationMinutes);
  });

  const days = [];
  for (let offset = 181; offset >= 0; offset -= 1) {
    const date = new Date(Date.now() - offset * 24 * 60 * 60 * 1000);
    const key = date.toISOString().slice(0, 10);
    const item = map.get(key) || { date: key, totalMinutes: 0, games: [] };
    days.push({
      ...item,
      intensity: item.totalMinutes >= 180 ? 4 : item.totalMinutes >= 91 ? 3 : item.totalMinutes >= 31 ? 2 : item.totalMinutes > 0 ? 1 : 0
    });
  }

  return days;
};

export const getAchievementSummaryForUser = async (user) => {
  const achievements = await getSteamAchievementsForUser(user);
  const total = achievements.length;
  const unlocked = achievements.filter((item) => item.achieved).length;
  const recentUnlocks = achievements.filter((item) => item.achieved).sort((a, b) => new Date(b.unlockTime || 0) - new Date(a.unlockTime || 0)).slice(0, 6);
  const rarest = achievements.filter((item) => item.achieved && item.rarityPercent).sort((a, b) => a.rarityPercent - b.rarityPercent).slice(0, 6);
  const byGame = new Map();
  achievements.forEach((achievement) => {
    const row = byGame.get(achievement.gameName) || { gameName: achievement.gameName, total: 0, unlocked: 0 };
    row.total += 1;
    if (achievement.achieved) row.unlocked += 1;
    byGame.set(achievement.gameName, row);
  });

  return {
    achievements,
    total,
    unlocked,
    locked: Math.max(0, total - unlocked),
    completionPercentage: total ? Math.round((unlocked / total) * 100) : 0,
    recentUnlocks,
    rarest,
    byGame: [...byGame.values()].map((item) => ({ ...item, completionPercentage: item.total ? Math.round((item.unlocked / item.total) * 100) : 0 }))
  };
};

export const calculatePlayerScore = async (user) => {
  const [profile, library, achievements, reviewRows, sessionCount, closedLobbyCount] = await Promise.all([
    GamerProfile.findOne({ userId: user._id }).select("reliabilityScore completedSessions noShows"),
    getSteamLibraryForUser(user),
    getSteamAchievementsForUser(user),
    Review.aggregate([
      { $match: { reviewedUserId: user._id } },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          average: { $avg: { $avg: ["$communication", "$teamwork", "$behavior"] } }
        }
      }
    ]),
    Session.countDocuments({ "members.userId": user._id, result: { $ne: "cancelled" } }),
    Lobby.countDocuments({ "currentMembers.userId": user._id, status: "closed" })
  ]);

  const totalMinutes = library.reduce((sum, game) => sum + (game.playtimeForeverMinutes || 0), 0);
  const recentMinutes = library.reduce((sum, game) => sum + (game.playtimeLastTwoWeeksMinutes || 0), 0);
  const unlocked = achievements.filter((item) => item.achieved).length;
  const reviewCount = reviewRows[0]?.count || 0;
  const reviewAvg = reviewRows[0]?.average || 0;
  const verifiedSessionCount = Math.max(sessionCount, Number(profile?.completedSessions) || 0);
  const hasTrackedMatches = verifiedSessionCount > 0 || closedLobbyCount > 0;
  const hasReliabilityEvidence = reviewCount > 0 || verifiedSessionCount > 0 || (profile?.noShows || 0) > 0;

  const breakdown = {
    gameDepth: clamp(totalMinutes / 120),
    recentActivity: clamp(recentMinutes / 20),
    gameDiversity: clamp(library.length * 5),
    achievementScore: clamp(achievements.length ? (unlocked / achievements.length) * 100 : 0),
    teamReliability: clamp(profile?.reliabilityScore || 0),
    communication: clamp(reviewAvg * 20),
    matchConsistency: clamp(verifiedSessionCount * 8 + Math.min(closedLobbyCount, 10) * 2)
  };
  const signals = [
    [breakdown.gameDepth, 0.18, library.length > 0],
    [breakdown.recentActivity, 0.14, library.length > 0],
    [breakdown.gameDiversity, 0.12, library.length > 0],
    [breakdown.achievementScore, 0.13, achievements.length > 0],
    [breakdown.teamReliability, 0.18, hasReliabilityEvidence],
    [breakdown.communication, 0.13, reviewCount > 0],
    [breakdown.matchConsistency, 0.12, hasTrackedMatches]
  ];
  const knownSignals = signals.filter(([, , available]) => available);
  const evidenceCoverage = knownSignals.reduce((sum, [, weight]) => sum + weight, 0);
  const weightedScore = evidenceCoverage
    ? knownSignals.reduce((sum, [value, weight]) => sum + value * weight, 0) / evidenceCoverage
    : 0;
  const overall = clamp(weightedScore * (0.35 + evidenceCoverage * 0.65));

  return {
    overall,
    breakdown,
    totalHours: minutesToHours(totalMinutes),
    confidence: Number(evidenceCoverage.toFixed(2)),
    evidence: {
      steamGames: library.length,
      achievements: achievements.length,
      teammateReviews: reviewCount,
      sessions: verifiedSessionCount,
      lobbies: closedLobbyCount
    },
    explanation: evidenceCoverage
      ? "Calculated only from available Steam, session, lobby, and teammate-review evidence."
      : "Connect Steam or track a ClutchQ session to calculate a player score."
  };
};

export const getMatchInsightsForUser = async (user) => {
  const [library, analyses] = await Promise.all([
    getSteamLibraryForUser(user),
    MatchAnalysis.find({ userId: user._id }).sort({ createdAt: -1 }).limit(8)
  ]);
  const favorite = library[0];
  const competitive = library.filter((game) => /counter|apex|dota|league|valorant|pubg|warzone/i.test(String(game.name || ""))).reduce((sum, game) => sum + (game.playtimeForeverMinutes || 0), 0);
  const coop = library.filter((game) => /lethal|helldivers|stardew|terraria|minecraft|overcooked|phasmo/i.test(String(game.name || ""))).reduce((sum, game) => sum + (game.playtimeForeverMinutes || 0), 0);
  const hasLibraryEvidence = library.length > 0;
  const mainGenre = !hasLibraryEvidence
    ? "Not enough data yet"
    : competitive === 0 && coop === 0
      ? "Mixed / casual"
      : competitive >= coop
        ? "Competitive / ranked"
        : "Co-op / party";

  return {
    favoriteGame: favorite?.name || "Not enough data yet",
    mainGenre,
    competitiveTendency: clamp(competitive / 80),
    coopTendency: clamp(coop / 60),
    casualTendency: hasLibraryEvidence ? clamp(library.length * 4 + coop / 100) : 0,
    bestSquadFit: !hasLibraryEvidence
      ? "Track activity to calculate a squad fit"
      : competitive >= coop
        ? "Ranked squad with clear roles and comms"
        : "Co-op party with patient teammates",
    recommendedGames: library.slice(0, 4),
    recentAnalyses: analyses
  };
};

export const createSteamNonce = () => crypto.randomBytes(16).toString("hex");
