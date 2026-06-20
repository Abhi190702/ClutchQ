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

const isDemoUser = (user) => user?.email === "demo@clutchq.com";
const minutesToHours = (minutes = 0) => Math.round((minutes / 60) * 10) / 10;
const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, Math.round(value)));
const getApiKey = () => process.env.STEAM_API_KEY;

const steamImage = (appId, hash) => (hash ? `https://media.steampowered.com/steamcommunity/public/images/apps/${appId}/${hash}.jpg` : "");

const steamFetch = async (path, params = {}) => {
  if (!getApiKey()) throw new SteamServiceError("Steam API key is not configured.", 500);
  const url = new URL(`${STEAM_API}/${path}`);
  Object.entries({ key: getApiKey(), format: "json", ...params }).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, value);
  });

  const response = await fetch(url);
  if (!response.ok) {
    if ([401, 403].includes(response.status)) {
      throw new SteamServiceError("Steam data is private or unavailable.", 200);
    }
    throw new SteamServiceError("Steam API request failed. Try again later.", response.status);
  }

  return response.json();
};

export const getPlayerSummary = async (steamId) => {
  const data = await steamFetch("ISteamUser/GetPlayerSummaries/v0002/", { steamids: steamId });
  return data?.response?.players?.[0] || null;
};

export const getOwnedGames = async (steamId) => {
  const data = await steamFetch("IPlayerService/GetOwnedGames/v0001/", {
    steamid: steamId,
    include_appinfo: true,
    include_played_free_games: true
  });
  return data?.response?.games || [];
};

export const getRecentlyPlayedGames = async (steamId) => {
  const data = await steamFetch("IPlayerService/GetRecentlyPlayedGames/v0001/", { steamid: steamId, count: 20 });
  return data?.response?.games || [];
};

export const getSteamLevel = async (steamId) => {
  const data = await steamFetch("IPlayerService/GetSteamLevel/v1/", { steamid: steamId });
  return data?.response?.player_level || 0;
};

export const getBadges = async (steamId) => {
  const data = await steamFetch("IPlayerService/GetBadges/v1/", { steamid: steamId });
  return data?.response?.badges || [];
};

export const getFriendList = async (steamId) => {
  const data = await steamFetch("ISteamUser/GetFriendList/v0001/", { steamid: steamId, relationship: "friend" });
  return data?.friendslist?.friends || [];
};

export const getPlayerAchievements = async (steamId, appId) => {
  const data = await steamFetch("ISteamUserStats/GetPlayerAchievements/v0001/", { steamid: steamId, appid: appId, l: "en" });
  return data?.playerstats?.achievements || [];
};

export const getSteamProvider = (user) => user?.authProviders?.steam || null;

const normalizeUrlValue = (value) => {
  if (!value) return null;
  const trimmed = String(value).trim().replace(/\/$/, "");
  if (!trimmed) return null;

  const fixed = trimmed.startsWith("https:") && !trimmed.startsWith("https://")
    ? trimmed.replace("https:", "https://")
    : trimmed.startsWith("http:") && !trimmed.startsWith("http://")
      ? trimmed.replace("http:", "http://")
      : trimmed;

  try {
    const url = new URL(fixed);
    if (!["http:", "https:"].includes(url.protocol) || !url.hostname) return null;
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

const safeNextPath = (value) => (typeof value === "string" && value.startsWith("/") && !value.startsWith("//") ? value : "/profile");

export const buildSteamAuthUrl = ({ returnTo, token, next } = {}) => {
  const callbackUrl = getSteamCallbackUrl();
  if (returnTo) callbackUrl.searchParams.set("returnTo", returnTo);
  if (token) callbackUrl.searchParams.set("linkToken", token);
  callbackUrl.searchParams.set("next", safeNextPath(next));

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
    if (key.startsWith("openid.")) params.set(key, value);
  });
  params.set("openid.mode", "check_authentication");

  const response = await fetch(STEAM_OPENID, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params
  });

  if (!response.ok) throw new SteamServiceError("Steam OpenID verification failed.", 401);
  const text = await response.text();
  if (!text.includes("is_valid:true")) throw new SteamServiceError("Steam login could not be verified.", 401);

  const claimedId = query["openid.claimed_id"] || query["openid.identity"] || "";
  const match = String(claimedId).match(/\/id\/(\d+)$/);
  if (!match) throw new SteamServiceError("SteamID was not returned by Steam.", 401);
  return match[1];
};

const toSteamGameDoc = (userId, steamId, game, recentByApp = new Map()) => {
  const recent = recentByApp.get(Number(game.appid));
  return {
    userId,
    steamId,
    appId: Number(game.appid),
    name: game.name,
    iconUrl: steamImage(game.appid, game.img_icon_url),
    logoUrl: steamImage(game.appid, game.img_logo_url),
    playtimeForeverMinutes: Number(game.playtime_forever || 0),
    playtimeLastTwoWeeksMinutes: Number(recent?.playtime_2weeks || game.playtime_2weeks || 0),
    lastPlayedAt: game.rtime_last_played ? new Date(Number(game.rtime_last_played) * 1000) : undefined,
    hasCommunityVisibleStats: game.has_community_visible_stats,
    source: "steam",
    lastSyncedAt: new Date()
  };
};

const upsertSteamGames = async (userId, steamId, games, recentGames = []) => {
  const recentByApp = new Map(recentGames.map((game) => [Number(game.appid), game]));
  const docs = games.map((game) => toSteamGameDoc(userId, steamId, game, recentByApp)).filter((game) => game.appId && game.name);

  await Promise.all(
    docs.map((doc) =>
      SteamGame.findOneAndUpdate({ userId, appId: doc.appId }, { $set: doc }, { new: true, upsert: true, runValidators: true })
    )
  );

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
            displayName: summary?.personaname || `Steam ${String(friend.steamid).slice(-4)}`,
            avatar: summary?.avatarfull || summary?.avatarmedium,
            profileUrl: summary?.profileurl,
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
      await Promise.all(
        achievements.slice(0, 80).map((achievement) =>
          SteamAchievement.findOneAndUpdate(
            { userId, appId: game.appId, achievementName: achievement.apiname },
            {
              $set: {
                userId,
                steamId,
                appId: game.appId,
                gameName: game.name,
                achievementName: achievement.apiname,
                displayName: achievement.name || achievement.apiname,
                description: achievement.description,
                icon: achievement.icon,
                iconGray: achievement.icongray,
                achieved: Boolean(achievement.achieved),
                unlockTime: achievement.unlocktime ? new Date(Number(achievement.unlocktime) * 1000) : undefined,
                lastSyncedAt: new Date()
              }
            },
            { new: true, upsert: true }
          )
        )
      );
      count += achievements.length;
    } catch {
      // Achievements are often private or unavailable per game; keep the rest of the sync healthy.
    }
  }

  return count;
};

export const syncSteamForUser = async (user) => {
  const provider = getSteamProvider(user);
  if (!provider?.steamId) throw new SteamServiceError("Connect Steam before syncing.", 400);

  const log = await SteamSyncLog.create({ userId: user._id, steamId: provider.steamId, syncType: "full", status: "running" });
  const privateSections = [];
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

    if (gamesResult.status === "rejected") privateSections.push("library");
    if (recentResult.status === "rejected") privateSections.push("recent");
    if (friendsResult.status === "rejected") privateSections.push("friends");

    user.authProviders = {
      ...(user.authProviders?.toObject?.() || user.authProviders || {}),
      steam: {
        ...provider,
        displayName: summary?.personaname || provider.displayName,
        avatar: summary?.avatarfull || provider.avatar,
        profileUrl: summary?.profileurl || provider.profileUrl,
        level,
        lastSyncedAt: new Date()
      }
    };
    await user.save();

    counts.games = await upsertSteamGames(user._id, provider.steamId, games, recentGames);
    counts.recentGames = recentGames.length;

    if (friends.length) {
      const friendIds = friends.map((friend) => friend.steamid).slice(0, 80).join(",");
      let friendSummaries = [];
      try {
        const data = await steamFetch("ISteamUser/GetPlayerSummaries/v0002/", { steamids: friendIds });
        friendSummaries = data?.response?.players || [];
      } catch {
        privateSections.push("friend profiles");
      }
      counts.friends = await upsertSteamFriends(user._id, provider.steamId, friends.slice(0, 80), friendSummaries);
    }

    const storedGames = await SteamGame.find({ userId: user._id }).sort({ playtimeForeverMinutes: -1 }).limit(10);
    counts.achievements = await upsertAchievements(user._id, provider.steamId, storedGames);

    log.status = privateSections.length ? "partial" : "success";
    log.message = privateSections.length ? "Steam synced with private sections skipped." : "Steam synced successfully.";
    log.privateSections = privateSections;
    log.counts = counts;
    log.finishedAt = new Date();
    await log.save();

    return { counts, privateSections, message: log.message };
  } catch (error) {
    log.status = "failed";
    log.message = error.message || "Steam sync failed.";
    log.privateSections = privateSections;
    log.counts = counts;
    log.finishedAt = new Date();
    await log.save();
    throw error;
  }
};

export const getSteamIdentityForUser = async (user) => {
  if (isDemoUser(user) && !getSteamProvider(user)?.steamId) return demoSteamIdentity;
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
    privacyStatus: lastLog?.privateSections?.length ? `Private: ${lastLog.privateSections.join(", ")}` : "Public or partially public"
  };
};

export const getSteamLibraryForUser = async (user) => {
  if (isDemoUser(user) && !(await SteamGame.exists({ userId: user._id }))) return demoSteamGames;
  return SteamGame.find({ userId: user._id }).sort({ playtimeForeverMinutes: -1 }).limit(200);
};

export const getSteamRecentForUser = async (user) => {
  const library = await getSteamLibraryForUser(user);
  return library
    .filter((game) => game.playtimeLastTwoWeeksMinutes || game.lastPlayedAt)
    .sort((a, b) => (b.playtimeLastTwoWeeksMinutes || 0) - (a.playtimeLastTwoWeeksMinutes || 0))
    .slice(0, 12);
};

export const getSteamAchievementsForUser = async (user) => {
  if (isDemoUser(user) && !(await SteamAchievement.exists({ userId: user._id }))) return demoSteamAchievements;
  return SteamAchievement.find({ userId: user._id }).sort({ achieved: -1, unlockTime: -1 }).limit(300);
};

export const getSteamFriendsForUser = async (user) => {
  if (isDemoUser(user) && !(await SteamFriend.exists({ userId: user._id }))) return demoSteamFriends;
  return SteamFriend.find({ userId: user._id }).sort({ onClutchQ: -1, displayName: 1 }).limit(80);
};

export const getFavoriteGamesForUser = async (user) => {
  const library = await getSteamLibraryForUser(user);
  const sorted = [...library].sort((a, b) => (b.playtimeForeverMinutes || 0) - (a.playtimeForeverMinutes || 0));
  const recent = [...library].sort((a, b) => (b.playtimeLastTwoWeeksMinutes || 0) - (a.playtimeLastTwoWeeksMinutes || 0));
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
  const key = date.toISOString().slice(0, 10);
  const day = map.get(key) || { date: key, totalMinutes: 0, games: [] };
  day.totalMinutes += minutes;
  const existing = day.games.find((game) => game.gameName === gameName);
  if (existing) existing.minutes += minutes;
  else day.games.push({ gameName, minutes });
  map.set(key, day);
};

export const getHeatmapForUser = async (user) => {
  const map = new Map();
  const library = await getSteamLibraryForUser(user);
  const activities = await GameActivity.find({ userId: user._id, status: "completed" }).sort({ endedAt: -1 }).limit(200);

  activities.forEach((activity) => {
    addHeatDay(map, activity.endedAt || activity.startedAt || activity.createdAt, activity.gameName || activity.gameSlug || "ClutchQ Session", activity.durationMinutes || 30);
  });

  library
    .filter((game) => game.playtimeLastTwoWeeksMinutes)
    .slice(0, 12)
    .forEach((game, index) => {
      const chunks = Math.min(5, Math.max(1, Math.ceil((game.playtimeLastTwoWeeksMinutes || 0) / 90)));
      for (let i = 0; i < chunks; i += 1) {
        addHeatDay(map, new Date(Date.now() - (index + i * 2) * 24 * 60 * 60 * 1000), game.name, Math.round((game.playtimeLastTwoWeeksMinutes || 0) / chunks));
      }
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
  const [profile, library, achievements, reviews, sessions, lobbies] = await Promise.all([
    GamerProfile.findOne({ userId: user._id }),
    getSteamLibraryForUser(user),
    getSteamAchievementsForUser(user),
    Review.find({ reviewedUserId: user._id }),
    Session.find({ "members.userId": user._id }),
    Lobby.find({ "currentMembers.userId": user._id })
  ]);

  const totalMinutes = library.reduce((sum, game) => sum + (game.playtimeForeverMinutes || 0), 0);
  const recentMinutes = library.reduce((sum, game) => sum + (game.playtimeLastTwoWeeksMinutes || 0), 0);
  const unlocked = achievements.filter((item) => item.achieved).length;
  const reviewAvg = reviews.length
    ? reviews.reduce((sum, review) => sum + ((review.communication || 0) + (review.teamwork || 0) + (review.behavior || 0)) / 3, 0) / reviews.length
    : 78;

  const breakdown = {
    gameDepth: clamp(totalMinutes / 120),
    recentActivity: clamp(recentMinutes / 20),
    gameDiversity: clamp(library.length * 5),
    achievementScore: clamp(achievements.length ? (unlocked / achievements.length) * 100 : 64),
    teamReliability: clamp(profile?.reliabilityScore || 80),
    communication: clamp(reviewAvg * 20),
    matchConsistency: clamp((sessions.length + lobbies.length) * 8 + (profile?.completedSessions || 0) * 2)
  };
  const overall = clamp(
    breakdown.gameDepth * 0.18 +
      breakdown.recentActivity * 0.14 +
      breakdown.gameDiversity * 0.12 +
      breakdown.achievementScore * 0.13 +
      breakdown.teamReliability * 0.18 +
      breakdown.communication * 0.13 +
      breakdown.matchConsistency * 0.12
  );

  return {
    overall,
    breakdown,
    totalHours: minutesToHours(totalMinutes),
    explanation: "Powered by Steam playtime, achievements, ClutchQ sessions, lobby reliability, and teammate reviews."
  };
};

export const getMatchInsightsForUser = async (user) => {
  const [library, analyses] = await Promise.all([
    getSteamLibraryForUser(user),
    MatchAnalysis.find({ userId: user._id }).sort({ createdAt: -1 }).limit(8)
  ]);
  const favorite = library[0];
  const competitive = library.filter((game) => /counter|apex|dota|league|valorant|pubg|warzone/i.test(game.name)).reduce((sum, game) => sum + (game.playtimeForeverMinutes || 0), 0);
  const coop = library.filter((game) => /lethal|helldivers|stardew|terraria|minecraft|overcooked|phasmo/i.test(game.name)).reduce((sum, game) => sum + (game.playtimeForeverMinutes || 0), 0);

  return {
    favoriteGame: favorite?.name || "Not enough data yet",
    mainGenre: competitive >= coop ? "Competitive / ranked" : "Co-op / party",
    competitiveTendency: clamp(competitive / 80),
    coopTendency: clamp(coop / 60),
    casualTendency: clamp((library.length * 4 + coop / 100) || 35),
    bestSquadFit: competitive >= coop ? "Ranked squad with clear roles and comms" : "Co-op party with patient teammates",
    recommendedGames: library.slice(0, 4),
    recentAnalyses: analyses
  };
};

export const createSteamNonce = () => crypto.randomBytes(16).toString("hex");
