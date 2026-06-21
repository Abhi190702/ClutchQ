import { safeNumber } from "./formatters";

const dayKey = (value) => {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return new Date().toISOString().slice(0, 10);
  return date.toISOString().slice(0, 10);
};

const todayAtOffset = (offset) => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - offset);
  return date;
};

export const buildPlaytimeSeries = (sessions = [], steamHeatmap = [], days = 30) => {
  const byDay = new Map();

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = todayAtOffset(offset);
    byDay.set(dayKey(date), {
      date: dayKey(date),
      label: date.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      minutes: 0,
      games: []
    });
  }

  steamHeatmap.forEach((item) => {
    const key = dayKey(item.date);
    const row = byDay.get(key);
    if (!row) return;
    row.minutes += safeNumber(item.totalMinutes);
    row.games = item.games || row.games;
  });

  sessions.forEach((session) => {
    const key = dayKey(session.endedAt || session.startedAt || session.createdAt);
    const row = byDay.get(key);
    if (!row) return;
    row.minutes += safeNumber(session.durationMinutes);
    if (session.gameName) row.games.push({ gameName: session.gameName, minutes: safeNumber(session.durationMinutes) });
  });

  return [...byDay.values()];
};

export const buildGameTimeSplit = (aggregates = [], steamLibrary = []) => {
  const map = new Map();

  aggregates.forEach((item) => {
    const name = item.gameName || item._id || item.gameSlug;
    if (!name) return;
    map.set(name, (map.get(name) || 0) + safeNumber(item.totalMinutes));
  });

  steamLibrary.forEach((item) => {
    const name = item.name || item.gameName;
    if (!name) return;
    map.set(name, Math.max(map.get(name) || 0, safeNumber(item.playtimeForeverMinutes)));
  });

  const sorted = [...map.entries()]
    .map(([gameName, minutes]) => ({ gameName, minutes }))
    .filter((item) => item.minutes > 0)
    .sort((a, b) => b.minutes - a.minutes);

  const top = sorted.slice(0, 4);
  const other = sorted.slice(4).reduce((sum, item) => sum + item.minutes, 0);
  return other ? [...top, { gameName: "Other", minutes: other }] : top;
};

export const findMostPlayedGame = (aggregates = [], steamLibrary = []) =>
  buildGameTimeSplit(aggregates, steamLibrary)[0]?.gameName || "No game yet";

export const getActivityStreak = (series = []) => {
  let streak = 0;
  for (let index = series.length - 1; index >= 0; index -= 1) {
    if (safeNumber(series[index].minutes) <= 0) break;
    streak += 1;
  }
  return streak;
};

export const buildActivitySnapshot = ({ aggregates = [], sessions = [], steamLibrary = [], series = [] }) => {
  const totalMinutes = buildGameTimeSplit(aggregates, steamLibrary).reduce((sum, item) => sum + item.minutes, 0);
  const weekMinutes = series.slice(-7).reduce((sum, item) => sum + safeNumber(item.minutes), 0);
  const monthMinutes = series.reduce((sum, item) => sum + safeNumber(item.minutes), 0);
  const bestRated = [...sessions].sort((a, b) => safeNumber(b.matchRating) - safeNumber(a.matchRating))[0];

  return {
    totalMinutes,
    weekMinutes,
    monthMinutes,
    sessionsCount: sessions.length,
    bestRatedGame: bestRated?.gameName || findMostPlayedGame(aggregates, steamLibrary),
    streak: getActivityStreak(series)
  };
};

export const deriveFriendCompatibility = ({ steamFriends = [], sessions = [], profile } = {}) => {
  const sessionGames = [...new Set(sessions.map((session) => session.gameName).filter(Boolean))];
  const primaryGame = profile?.games?.find((game) => game.isPrimary)?.gameName || profile?.games?.[0]?.gameName || sessionGames[0] || "Valorant";

  return steamFriends.slice(0, 6).map((friend, index) => ({
    id: friend._id || friend.friendSteamId || friend.displayName || index,
    name: friend.displayName || `Teammate ${index + 1}`,
    avatar: friend.avatar,
    compatibility: Math.max(72, 94 - index * 4),
    sharedGame: index % 2 === 0 ? primaryGame : sessionGames[index % sessionGames.length] || "CS2",
    role: index % 3 === 0 ? "Controller" : index % 3 === 1 ? "Sentinel" : "Flex",
    onClutchQ: Boolean(friend.onClutchQ)
  }));
};
