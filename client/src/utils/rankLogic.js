import { RANKS } from "./constants";

const rankMap = RANKS.reduce((map, rank, index) => {
  map[rank.toLowerCase()] = index + 1;
  return map;
}, {});

export const getRankValue = (rank = "") => rankMap[String(rank).toLowerCase()] || 10;

export const rankTone = (rank = "") => {
  if (/radiant|immortal|diamond/i.test(rank)) return "text-violet-200 border-violet-400/40 bg-violet-500/10";
  if (/platinum|gold/i.test(rank)) return "text-amber-100 border-amber-400/40 bg-amber-500/10";
  if (/silver|bronze|iron/i.test(rank)) return "text-cyan-100 border-cyan-400/30 bg-cyan-500/10";
  return "text-slate-100 border-slate-400/30 bg-slate-500/10";
};

export const getPrimaryGame = (profile) => profile?.games?.find((game) => game.isPrimary) || profile?.games?.[0];
