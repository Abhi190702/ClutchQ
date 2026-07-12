import calculateMatchScore from "./calculateMatchScore.js";
import { getGameForContext } from "./rankLogic.js";

const ROLE_TEMPLATE = ["Duelist", "Controller", "Initiator", "Sentinel", "Flex"];

const safeName = (profile) => profile?.displayName || profile?.userId?.name || "Unknown Player";

export const calculateSquadChemistry = (profiles = [], lobby = null) => {
  const pairwiseScores = [];
  let total = 0;
  let pairs = 0;
  let strongestPair = null;
  let needsCoordinationPair = null;

  for (let i = 0; i < profiles.length; i += 1) {
    for (let j = i + 1; j < profiles.length; j += 1) {
      const result = calculateMatchScore(profiles[i], profiles[j], { game: lobby?.game });
      const pair = {
        players: [safeName(profiles[i]), safeName(profiles[j])],
        ids: [String(profiles[i]._id), String(profiles[j]._id)],
        score: result.totalScore,
        reason:
          result.warnings[0] ||
          result.partials[0] ||
          result.positives[0] ||
          "Balanced compatibility across squad signals."
      };

      pairwiseScores.push(pair);
      total += result.totalScore;
      pairs += 1;

      if (!strongestPair || pair.score > strongestPair.score) strongestPair = pair;
      if (!needsCoordinationPair || pair.score < needsCoordinationPair.score) needsCoordinationPair = pair;
    }
  }

  const filledRoles = profiles.flatMap((profile) => getGameForContext(profile, lobby?.game)?.roles || []);
  const requiredRoles = lobby?.neededRoles?.length ? lobby.neededRoles : ROLE_TEMPLATE;
  const missingRoles = requiredRoles.filter((role) => !filledRoles.includes(role));
  const roleScore = Math.round(((requiredRoles.length - missingRoles.length) / requiredRoles.length) * 100);

  const ranks = profiles.map((profile) => getGameForContext(profile, lobby?.game)?.rankValue || 0).filter(Boolean);
  const rankSpread = ranks.length > 1 ? Math.max(...ranks) - Math.min(...ranks) : 0;
  const languageCounts = new Map();

  profiles.forEach((profile) => {
    profile.languages?.forEach((language) => {
      languageCounts.set(language, (languageCounts.get(language) || 0) + 1);
    });
  });

  const commonLanguages = [...languageCounts.entries()]
    .filter(([, count]) => count >= Math.max(2, Math.ceil(profiles.length / 2)))
    .map(([language]) => language);

  const warnings = [];
  missingRoles.forEach((role) => warnings.push(`Missing ${role}`));
  if (rankSpread > 6) warnings.push("Rank spread is slightly high");
  if (!commonLanguages.length && profiles.length > 1) warnings.push("No clear squad language overlap");

  const chemistryScore = pairs ? Math.round(total / pairs) : roleScore;
  const roleBalance = {
    required: requiredRoles,
    filled: filledRoles,
    missing: missingRoles,
    score: roleScore
  };

  return {
    chemistryScore,
    roleBalance,
    strongestPair: strongestPair || {
      players: profiles.slice(0, 2).map(safeName),
      score: chemistryScore
    },
    needsCoordinationPair: needsCoordinationPair
      ? {
          ...needsCoordinationPair,
          reason: needsCoordinationPair.reason
        }
      : null,
    pairwiseScores,
    rankSpread,
    commonLanguages,
    warnings
  };
};

export default calculateSquadChemistry;
