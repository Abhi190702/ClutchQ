import { calculateAvailabilityOverlap } from "./calculateAvailabilityOverlap.js";
import { getPrimaryGame, getRankGap, rankGapLabel } from "./rankLogic.js";

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value));
const intersect = (a = [], b = []) => a.filter((item) => b.includes(item));
const averageDifference = (a = {}, b = {}) => {
  const keys = ["aggression", "support", "communication", "consistency", "adaptability"];
  const total = keys.reduce((sum, key) => sum + Math.abs((a[key] || 50) - (b[key] || 50)), 0);
  return Math.round(total / keys.length);
};

const addCriterion = (breakdown, key, label, score, max, reason, status = "matched") => {
  breakdown.push({
    key,
    label,
    score: clamp(Math.round(score), 0, max),
    max,
    reason,
    status
  });
};

export const getMatchConfidence = (profileA, profileB) => {
  const completeA = profileA?.profileCompleteness || 0;
  const completeB = profileB?.profileCompleteness || 0;
  const hasAvailability = Boolean(profileA?.availability?.length && profileB?.availability?.length);
  const hasReviews = (profileA?.totalReviews || 0) >= 2 && (profileB?.totalReviews || 0) >= 2;

  if (completeA >= 80 && completeB >= 80 && hasAvailability && hasReviews) {
    return { level: "High", reason: "Both profiles are complete with availability and review history." };
  }

  if (completeA >= 60 && completeB >= 60 && (hasAvailability || hasReviews)) {
    return { level: "Medium", reason: "Enough profile data exists, with either schedule or review signals." };
  }

  return { level: "Low", reason: "Major profile data is missing, so this recommendation is less certain." };
};

export const calculateMatchScore = (profileA, profileB, options = {}) => {
  const breakdown = [];
  const positives = [];
  const partials = [];
  const warnings = [];

  const gameA = getPrimaryGame(profileA);
  const gameB = getPrimaryGame(profileB);
  const targetGame = options.game || gameA?.gameName;
  const sameGame = gameA?.gameName && gameB?.gameName && gameA.gameName === gameB.gameName;

  addCriterion(
    breakdown,
    "game",
    "Game Match",
    sameGame ? 25 : targetGame && gameB?.gameName === targetGame ? 18 : 4,
    25,
    sameGame ? `Both main ${gameA.gameName}.` : `${profileB.displayName} mains ${gameB?.gameName || "another game"}.`,
    sameGame ? "matched" : "warning"
  );
  if (sameGame) positives.push(`Same game: ${gameA.gameName}`);
  else warnings.push("Primary game differs");

  const gap = getRankGap(gameA?.rankValue || 0, gameB?.rankValue || 0);
  const rankScore = gap <= 2 ? 20 : gap <= 5 ? 14 : gap <= 8 ? 8 : 2;
  addCriterion(
    breakdown,
    "rank",
    "Rank Match",
    rankScore,
    20,
    `${gameA?.rank || "Unknown"} vs ${gameB?.rank || "Unknown"}: ${rankGapLabel(gap)}.`,
    gap <= 2 ? "matched" : gap <= 5 ? "partial" : "warning"
  );
  if (gap <= 2) positives.push(`Similar rank: ${gameA.rank} and ${gameB.rank}`);
  else if (gap <= 5) partials.push("Rank gap is playable but not perfect");
  else warnings.push("Rank gap is high");

  const sameRegion = profileA?.region && profileA.region === profileB?.region;
  addCriterion(
    breakdown,
    "region",
    "Region Match",
    sameRegion ? 15 : 4,
    15,
    sameRegion ? `Same region: ${profileA.region}.` : `${profileA?.region || "Unknown"} vs ${profileB?.region || "Unknown"}.`,
    sameRegion ? "matched" : "warning"
  );
  if (sameRegion) positives.push(`Same region: ${profileA.region}`);
  else warnings.push("Different queue region");

  const sharedLanguages = intersect(profileA?.languages || [], profileB?.languages || []);
  addCriterion(
    breakdown,
    "language",
    "Language Match",
    sharedLanguages.length ? 10 : 0,
    10,
    sharedLanguages.length ? `Shared language: ${sharedLanguages.join(", ")}.` : "No common language.",
    sharedLanguages.length ? "matched" : "warning"
  );
  if (sharedLanguages.length) positives.push(`Language overlap: ${sharedLanguages.join(", ")}`);
  else warnings.push("No common language");

  const availability = calculateAvailabilityOverlap(profileA?.availability || [], profileB?.availability || []);
  addCriterion(
    breakdown,
    "availability",
    "Availability",
    availability.overlapHours >= 3 ? 15 : availability.overlapHours > 0 ? 8 : 0,
    15,
    availability.summary,
    availability.overlapHours >= 3 ? "matched" : availability.overlapHours > 0 ? "partial" : "warning"
  );
  if (availability.overlapHours >= 3) positives.push(`Availability overlap: ${availability.overlapHours} hours`);
  else if (availability.overlapHours > 0) partials.push("Availability overlap is limited");
  else warnings.push("No common availability tonight");

  const rolesA = gameA?.roles || [];
  const rolesB = gameB?.roles || [];
  const roleConflict = rolesA.some((role) => rolesB.includes(role));
  const complementary = rolesA.length && rolesB.length && !roleConflict;
  addCriterion(
    breakdown,
    "roles",
    "Role Balance",
    complementary ? 10 : roleConflict ? 6 : 2,
    10,
    complementary ? `${rolesA.join("/")} pairs well with ${rolesB.join("/")}.` : `Role overlap: ${intersect(rolesA, rolesB).join(", ") || "unclear"}.`,
    complementary ? "matched" : roleConflict ? "partial" : "warning"
  );
  if (complementary) positives.push(`Compatible roles: ${rolesA[0]} + ${rolesB[0]}`);
  else partials.push("Possible role conflict");

  const styleGap = averageDifference(profileA?.playstyleStats, profileB?.playstyleStats);
  const styleScore = styleGap <= 12 ? 5 : styleGap <= 28 ? 3 : 1;
  addCriterion(
    breakdown,
    "playstyle",
    "Playstyle",
    styleScore,
    5,
    styleGap <= 12 ? "Playstyle profiles are closely aligned." : `Playstyle difference index: ${styleGap}.`,
    styleGap <= 12 ? "matched" : styleGap <= 28 ? "partial" : "warning"
  );
  if (styleGap <= 12) positives.push("Playstyle profiles line up");
  else partials.push("Playstyle may need communication");

  const totalScore = clamp(breakdown.reduce((sum, item) => sum + item.score, 0));
  const confidence = getMatchConfidence(profileA, profileB);

  return {
    totalScore,
    confidence,
    breakdown,
    positives,
    partials,
    warnings,
    availability,
    sharedLanguages,
    roleFit: {
      yourRoles: rolesA,
      theirRoles: rolesB,
      complementary,
      conflict: roleConflict
    }
  };
};

export default calculateMatchScore;
