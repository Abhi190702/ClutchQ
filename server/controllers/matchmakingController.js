import GamerProfile from "../models/GamerProfile.js";
import GameplayGraph from "../models/GameplayGraph.js";
import Lobby from "../models/Lobby.js";
import User from "../models/User.js";
import { asyncHandler } from "../middleware/errorMiddleware.js";
import calculateMatchScore from "../utils/calculateMatchScore.js";
import calculateSquadChemistry from "../utils/calculateSquadChemistry.js";
import { getPrimaryGame, isRankBetween } from "../utils/rankLogic.js";

const getCurrentProfileOrFail = async (userId) => {
  const profile = await GamerProfile.findOne({ userId });
  if (!profile) {
    const error = new Error("Create your gamer profile before matchmaking");
    error.statusCode = 400;
    throw error;
  }
  return profile;
};

const visibleUsersQuery = async () => {
  const suspendedUsers = await User.find({ isSuspended: true }).select("_id");
  return { userId: { $nin: suspendedUsers.map((user) => user._id) } };
};

const enhanceWithGraphFit = (baseMatch, viewerGraph, candidateGraph) => {
  if (!viewerGraph || !candidateGraph) return baseMatch;

  const viewerGames = new Set((viewerGraph.gameProfiles || []).map((game) => game.gameName).filter(Boolean));
  const sharedGames = (candidateGraph.gameProfiles || []).map((game) => game.gameName).filter((game) => viewerGames.has(game));
  const edge = (viewerGraph.teammateEdges || []).find((item) => String(item.userId) === String(candidateGraph.userId));
  const graphConfidence = Math.min(Number(viewerGraph.confidence) || 0, Number(candidateGraph.confidence) || 0);
  const reasons = [];
  let bonus = 0;

  if (sharedGames.length) {
    bonus += Math.min(3, sharedGames.length * 1.5);
    reasons.push("Shared recent rhythm");
  }
  if (edge?.compatibility >= 80) {
    bonus += 3;
    reasons.push("Strong graph fit");
  }
  if (candidateGraph.style?.mainStyle && viewerGraph.style?.mainStyle && candidateGraph.style.mainStyle !== viewerGraph.style.mainStyle) {
    bonus += 2;
    reasons.push("Complementary playstyle");
  }
  if (graphConfidence >= 0.65) {
    bonus += 2;
  } else {
    reasons.push("Low confidence: limited history");
  }

  const graphFitBonus = Math.min(10, Math.round(bonus));
  return {
    ...baseMatch,
    totalScore: Math.min(100, baseMatch.totalScore + graphFitBonus),
    baseScore: baseMatch.totalScore,
    graphFitBonus,
    graphReasons: reasons
  };
};

export const getRecommendations = asyncHandler(async (req, res) => {
  const currentProfile = await getCurrentProfileOrFail(req.user._id);
  const query = await visibleUsersQuery();
  query.userId.$nin.push(req.user._id);

  const candidates = await GamerProfile.find(query).populate("userId", "name avatar role");
  const candidateUserIds = candidates.map((profile) => profile.userId?._id || profile.userId);
  const graphs = await GameplayGraph.find({ userId: { $in: [req.user._id, ...candidateUserIds] } }).lean();
  const graphByUser = new Map(graphs.map((graph) => [String(graph.userId), graph]));
  const viewerGraph = graphByUser.get(String(req.user._id));

  const recommendations = candidates
    .map((profile) => {
      const candidateGraph = graphByUser.get(String(profile.userId?._id || profile.userId));
      return {
        profile,
        match: enhanceWithGraphFit(calculateMatchScore(currentProfile, profile), viewerGraph, candidateGraph)
      };
    })
    .sort((a, b) => b.match.totalScore - a.match.totalScore)
    .slice(0, Number(req.query.limit) || 12);

  res.json({
    success: true,
    message: "Recommended players loaded",
    data: recommendations
  });
});

export const explainMatch = asyncHandler(async (req, res) => {
  const currentProfile = await getCurrentProfileOrFail(req.user._id);
  const target = await GamerProfile.findById(req.params.profileId).populate("userId", "name avatar role");

  if (!target) {
    res.status(404);
    throw new Error("Player profile not found");
  }

  const graphs = await GameplayGraph.find({
    userId: { $in: [req.user._id, target.userId?._id || target.userId] }
  }).lean();
  const graphByUser = new Map(graphs.map((graph) => [String(graph.userId), graph]));

  res.json({
    success: true,
    message: "Match explanation generated",
    data: {
      profile: target,
      match: enhanceWithGraphFit(
        calculateMatchScore(currentProfile, target),
        graphByUser.get(String(req.user._id)),
        graphByUser.get(String(target.userId?._id || target.userId))
      )
    }
  });
});

export const compareProfiles = asyncHandler(async (req, res) => {
  const currentProfile = await getCurrentProfileOrFail(req.user._id);
  const target = await GamerProfile.findById(req.params.profileId).populate("userId", "name avatar role");

  if (!target) {
    res.status(404);
    throw new Error("Player profile not found");
  }

  const graphs = await GameplayGraph.find({
    userId: { $in: [req.user._id, target.userId?._id || target.userId] }
  }).lean();
  const graphByUser = new Map(graphs.map((graph) => [String(graph.userId), graph]));

  res.json({
    success: true,
    message: "Profile comparison ready",
    data: {
      currentProfile,
      targetProfile: target,
      match: enhanceWithGraphFit(
        calculateMatchScore(currentProfile, target),
        graphByUser.get(String(req.user._id)),
        graphByUser.get(String(target.userId?._id || target.userId))
      )
    }
  });
});

const lobbyCompatibility = async (currentProfile, lobby) => {
  const memberIds = lobby.currentMembers.map((member) => member.userId?._id || member.userId);
  const memberProfiles = await GamerProfile.find({ userId: { $in: memberIds } }).populate("userId", "name avatar role");
  const scores = memberProfiles.map((profile) => calculateMatchScore(currentProfile, profile, { game: lobby.game }).totalScore);
  const currentGame = getPrimaryGame(currentProfile);
  const inRank = isRankBetween(currentGame?.rankValue, lobby.rankMinValue, lobby.rankMaxValue);
  const rankBonus = inRank ? 8 : -12;
  const micWarning = lobby.micRequired && !currentProfile.micAvailable ? -15 : 0;
  const average = scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 65;

  return Math.max(0, Math.min(100, Math.round(average + rankBonus + micWarning)));
};

export const findSquadNow = asyncHandler(async (req, res) => {
  const currentProfile = await getCurrentProfileOrFail(req.user._id);
  const query = await visibleUsersQuery();
  query.userId.$nin.push(req.user._id);

  const candidates = await GamerProfile.find(query).populate("userId", "name avatar role");
  const candidateUserIds = candidates.map((profile) => profile.userId?._id || profile.userId);
  const graphs = await GameplayGraph.find({ userId: { $in: [req.user._id, ...candidateUserIds] } }).lean();
  const graphByUser = new Map(graphs.map((graph) => [String(graph.userId), graph]));
  const viewerGraph = graphByUser.get(String(req.user._id));
  const scoredPlayers = candidates
    .map((profile) => {
      const candidateGraph = graphByUser.get(String(profile.userId?._id || profile.userId));
      return {
        profile,
        match: enhanceWithGraphFit(calculateMatchScore(currentProfile, profile), viewerGraph, candidateGraph)
      };
    })
    .sort((a, b) => b.match.totalScore - a.match.totalScore);

  const bestSquadPlayers = scoredPlayers.slice(0, 4);
  const lobbies = await Lobby.find({ status: "open" }).populate("ownerId", "name avatar").limit(30);
  const scoredLobbies = await Promise.all(
    lobbies.map(async (lobby) => ({
      lobby,
      score: await lobbyCompatibility(currentProfile, lobby)
    }))
  );

  const bestOpenLobby = scoredLobbies.sort((a, b) => b.score - a.score)[0] || null;
  const squadProfiles = [currentProfile, ...bestSquadPlayers.map((item) => item.profile)];
  const chemistry = calculateSquadChemistry(squadProfiles, bestOpenLobby?.lobby);
  const strongest = bestSquadPlayers[0];

  res.json({
    success: true,
    message: "Best squad found",
    data: {
      bestSquadPlayers,
      bestOpenLobby,
      squadCompatibilityScore: chemistry.chemistryScore,
      strongestMatch: strongest?.profile,
      whySelected: [
        strongest?.match?.positives?.[0] || "High player compatibility",
        bestOpenLobby ? `Best open lobby: ${bestOpenLobby.lobby.title}` : "No open lobby beats direct squad building",
        chemistry.warnings.length ? chemistry.warnings[0] : "Role and schedule signals are stable"
      ].filter(Boolean),
      missingRoles: chemistry.roleBalance.missing,
      recommendedAction: bestOpenLobby ? "Request to join" : "Send teammate requests",
      chemistry
    }
  });
});
