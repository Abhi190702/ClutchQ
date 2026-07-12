import { calculateAvailabilityOverlap } from "./calculateAvailabilityOverlap.js";
import { getGameForContext, getRankGap, normalizeGameKey, rankGapLabel } from "./rankLogic.js";

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value));
const normalizedSet = (values = []) => new Set(values.map((value) => String(value).trim().toLowerCase()).filter(Boolean));
const hasPlaystyleData = (value) => value && typeof value === "object" && Object.values(value).some((item) => Number.isFinite(Number(item)));
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

  const targetGame = options.game;
  const gameA = getGameForContext(profileA, targetGame);
  const gameB = getGameForContext(profileB, targetGame);
  const sameGame =
    gameA?.gameName &&
    gameB?.gameName &&
    normalizeGameKey(gameA.gameName) === normalizeGameKey(gameB.gameName);
  const hasBothGames = Boolean(gameA?.gameName && gameB?.gameName);

  addCriterion(
    breakdown,
    "game",
    "Game Match",
    sameGame ? 25 : hasBothGames ? 4 : 0,
    25,
    sameGame ? `Both main ${gameA.gameName}.` : hasBothGames ? `${profileB.displayName} mains ${gameB.gameName}.` : "Primary game data is incomplete.",
    sameGame ? "matched" : hasBothGames ? "warning" : "missing"
  );
  if (sameGame) positives.push(`Same game: ${gameA.gameName}`);
  else warnings.push("Primary game differs");

  const hasRank = (game) => Boolean(game?.rank && Number.isFinite(Number(game.rankValue)) && Number(game.rankValue) > 0);
  const hasBothRanks = hasRank(gameA) && hasRank(gameB);
  const gap = hasBothRanks ? getRankGap(Number(gameA.rankValue), Number(gameB.rankValue)) : null;
  const rankScore = !hasBothRanks ? 0 : gap <= 2 ? 20 : gap <= 5 ? 14 : gap <= 8 ? 8 : 2;
  addCriterion(
    breakdown,
    "rank",
    "Rank Match",
    rankScore,
    20,
    hasBothRanks ? `${gameA?.rank || "Unranked"} vs ${gameB?.rank || "Unranked"}: ${rankGapLabel(gap)}.` : "Rank data is incomplete.",
    !hasBothRanks ? "missing" : gap <= 2 ? "matched" : gap <= 5 ? "partial" : "warning"
  );
  if (!hasBothRanks) warnings.push("Rank data is incomplete");
  else if (gap <= 2) positives.push(`Similar rank: ${gameA.rank || "Unranked"} and ${gameB.rank || "Unranked"}`);
  else if (gap <= 5) partials.push("Rank gap is playable but not perfect");
  else warnings.push("Rank gap is high");

  const hasBothRegions = Boolean(profileA?.region && profileB?.region);
  const sameRegion = hasBothRegions && String(profileA.region).trim().toLowerCase() === String(profileB.region).trim().toLowerCase();
  addCriterion(
    breakdown,
    "region",
    "Region Match",
    sameRegion ? 15 : hasBothRegions ? 4 : 0,
    15,
    sameRegion ? `Same region: ${profileA.region}.` : `${profileA?.region || "Unknown"} vs ${profileB?.region || "Unknown"}.`,
    sameRegion ? "matched" : hasBothRegions ? "warning" : "missing"
  );
  if (sameRegion) positives.push(`Same region: ${profileA.region}`);
  else warnings.push("Different queue region");

  const hasBothLanguages = Boolean(profileA?.languages?.length && profileB?.languages?.length);
  const languagesB = normalizedSet(profileB?.languages || []);
  const sharedLanguages = (profileA?.languages || []).filter((language) => languagesB.has(String(language).trim().toLowerCase()));
  addCriterion(
    breakdown,
    "language",
    "Language Match",
    sharedLanguages.length ? 10 : 0,
    10,
    sharedLanguages.length ? `Shared language: ${sharedLanguages.join(", ")}.` : hasBothLanguages ? "No common language." : "Language data is incomplete.",
    sharedLanguages.length ? "matched" : hasBothLanguages ? "warning" : "missing"
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
  const hasBothRoles = Boolean(rolesA.length && rolesB.length);
  const normalizedRolesB = normalizedSet(rolesB);
  const roleConflict = hasBothRoles && rolesA.some((role) => normalizedRolesB.has(String(role).trim().toLowerCase()));
  const complementary = hasBothRoles && !roleConflict;
  addCriterion(
    breakdown,
    "roles",
    "Role Balance",
    complementary ? 10 : roleConflict ? 6 : 0,
    10,
    complementary
      ? `${rolesA.join("/")} pairs well with ${rolesB.join("/")}.`
      : `Role overlap: ${rolesA.filter((role) => normalizedRolesB.has(String(role).trim().toLowerCase())).join(", ") || "unclear"}.`,
    complementary ? "matched" : roleConflict ? "partial" : "missing"
  );
  if (complementary) positives.push(`Compatible roles: ${rolesA[0]} + ${rolesB[0]}`);
  else partials.push("Possible role conflict");

  const hasBothStyles = hasPlaystyleData(profileA?.playstyleStats) && hasPlaystyleData(profileB?.playstyleStats);
  const styleGap = hasBothStyles ? averageDifference(profileA.playstyleStats, profileB.playstyleStats) : null;
  const styleScore = !hasBothStyles ? 0 : styleGap <= 12 ? 5 : styleGap <= 28 ? 3 : 1;
  addCriterion(
    breakdown,
    "playstyle",
    "Playstyle",
    styleScore,
    5,
    hasBothStyles ? (styleGap <= 12 ? "Playstyle profiles are closely aligned." : `Playstyle difference index: ${styleGap}.`) : "Playstyle data is incomplete.",
    !hasBothStyles ? "missing" : styleGap <= 12 ? "matched" : styleGap <= 28 ? "partial" : "warning"
  );
  if (!hasBothStyles) warnings.push("Playstyle data is incomplete");
  else if (styleGap <= 12) positives.push("Playstyle profiles line up");
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
