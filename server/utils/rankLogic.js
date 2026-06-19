const VALORANT_RANKS = [
  "Iron 1",
  "Iron 2",
  "Iron 3",
  "Bronze 1",
  "Bronze 2",
  "Bronze 3",
  "Silver 1",
  "Silver 2",
  "Silver 3",
  "Gold 1",
  "Gold 2",
  "Gold 3",
  "Platinum 1",
  "Platinum 2",
  "Platinum 3",
  "Diamond 1",
  "Diamond 2",
  "Diamond 3",
  "Ascendant 1",
  "Ascendant 2",
  "Ascendant 3",
  "Immortal 1",
  "Immortal 2",
  "Immortal 3",
  "Radiant"
];

const GENERIC_RANKS = [
  "Bronze",
  "Silver",
  "Gold",
  "Platinum",
  "Diamond",
  "Master",
  "Grandmaster",
  "Elite",
  "Champion"
];

export const rankValueMap = [...VALORANT_RANKS, ...GENERIC_RANKS].reduce((map, rank, index) => {
  map[rank.toLowerCase()] = index + 1;
  return map;
}, {});

export const getRankValue = (rank = "") => {
  const normalized = String(rank).trim().toLowerCase();
  if (rankValueMap[normalized]) return rankValueMap[normalized];

  const tier = GENERIC_RANKS.find((name) => normalized.includes(name.toLowerCase()));
  return tier ? rankValueMap[tier.toLowerCase()] : 10;
};

export const normalizeGameRank = (game) => ({
  ...game,
  rankValue: game.rankValue || getRankValue(game.rank)
});

export const getPrimaryGame = (profile) => {
  if (!profile?.games?.length) return null;
  return profile.games.find((game) => game.isPrimary) || profile.games[0];
};

export const getRankGap = (a, b) => Math.abs((a || 0) - (b || 0));

export const rankGapLabel = (gap) => {
  if (gap <= 2) return "Very close rank";
  if (gap <= 5) return "Playable rank spread";
  if (gap <= 8) return "Wide rank spread";
  return "Rank gap warning";
};

export const isRankBetween = (rankValue, minValue, maxValue) => {
  if (!rankValue) return false;
  const low = minValue || 0;
  const high = maxValue || 999;
  return rankValue >= low && rankValue <= high;
};

export const rankOptions = VALORANT_RANKS;
