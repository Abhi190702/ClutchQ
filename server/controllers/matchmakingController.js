import GamerProfile from "../models/GamerProfile.js";
import GameplayGraph from "../models/GameplayGraph.js";
import Lobby from "../models/Lobby.js";
import { asyncHandler } from "../middleware/errorMiddleware.js";
import calculateMatchScore from "../utils/calculateMatchScore.js";
import calculateSquadChemistry from "../utils/calculateSquadChemistry.js";
import { getGameForContext, isRankBetween } from "../utils/rankLogic.js";

const getCurrentProfileOrFail = async (userId) => {
  const profile = await GamerProfile.findOne({ userId });
  if (!profile) {
    const error = new Error("Create your gamer profile before matchmaking");
    error.statusCode = 400;
    throw error;
  }
  return profile;
};

const getVisibleCandidates = async (viewerId) => {
  const rows = await GamerProfile.find({ userId: { $ne: viewerId } })
    .select("-customAvatar.dataUrl")
    .populate({ path: "userId", select: "name avatar role isSuspended", match: { isSuspended: { $ne: true } } })
    .sort({ trustScore: -1, reliabilityScore: -1 })
    .limit(240);
  return rows.filter((profile) => profile.userId).slice(0, 200);
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
  const candidates = await getVisibleCandidates(req.user._id);
  const candidateUserIds = candidates.map((profile) => profile.userId?._id || profile.userId);
  const graphs = await GameplayGraph.find({ userId: { $in: [req.user._id, ...candidateUserIds] } }).lean();
  const graphByUser = new Map(graphs.map((graph) => [String(graph.userId), graph]));
  const viewerGraph = graphByUser.get(String(req.user._id));

  const requestedLimit = Number.parseInt(req.query.limit, 10);
  const limit = Number.isFinite(requestedLimit) ? Math.max(1, Math.min(50, requestedLimit)) : 12;
  const recommendations = candidates
    .map((profile) => {
      const candidateGraph = graphByUser.get(String(profile.userId?._id || profile.userId));
      return {
        profile,
        match: enhanceWithGraphFit(calculateMatchScore(currentProfile, profile), viewerGraph, candidateGraph)
      };
    })
    .sort((a, b) => b.match.totalScore - a.match.totalScore)
    .slice(0, limit);

  res.json({
    success: true,
    message: "Recommended players loaded",
    data: recommendations
  });
});

export const explainMatch = asyncHandler(async (req, res) => {
  const currentProfile = await getCurrentProfileOrFail(req.user._id);
  const target = await GamerProfile.findById(req.params.profileId).populate("userId", "name avatar role isSuspended");

  if (!target?.userId || target.userId.isSuspended) {
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
  const target = await GamerProfile.findById(req.params.profileId).populate("userId", "name avatar role isSuspended");

  if (!target?.userId || target.userId.isSuspended) {
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

export const calculateLobbyCompatibility = (currentProfile, lobby, profileByUser) => {
  const memberProfiles = lobby.currentMembers
    .map((member) => profileByUser.get(String(member.userId?._id || member.userId)))
    .filter(Boolean);
  const scores = memberProfiles.map((profile) => calculateMatchScore(currentProfile, profile, { game: lobby.game }).totalScore);
  const currentGame = getGameForContext(currentProfile, lobby.game);
  const inRank = isRankBetween(currentGame?.rankValue, lobby.rankMinValue, lobby.rankMaxValue);
  const rankBonus = inRank ? 8 : -12;
  const micWarning = lobby.micRequired && !currentProfile.micAvailable ? -15 : 0;
  const average = scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;

  return Math.max(0, Math.min(100, Math.round(average + rankBonus + micWarning)));
};

export const findSquadNow = asyncHandler(async (req, res) => {
  const currentProfile = await getCurrentProfileOrFail(req.user._id);
  const candidates = await getVisibleCandidates(req.user._id);
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
  const lobbies = await Lobby.find({ status: "open" })
    .select("-discord.inviteUrl -discord.channelId")
    .populate({ path: "ownerId", select: "name avatar", match: { isSuspended: { $ne: true } } })
    .limit(30);
  const lobbyMemberIds = [...new Set(lobbies.flatMap((lobby) => lobby.currentMembers.map((member) => String(member.userId?._id || member.userId))))];
  const lobbyMemberProfiles = await GamerProfile.find({ userId: { $in: lobbyMemberIds } })
    .select("-customAvatar.dataUrl")
    .populate({ path: "userId", select: "name avatar role", match: { isSuspended: { $ne: true } } });
  const lobbyProfileByUser = new Map(
    lobbyMemberProfiles
      .filter((profile) => profile.userId)
      .map((profile) => [String(profile.userId?._id || profile.userId), profile])
  );
  const scoredLobbies = lobbies.filter((lobby) => lobby.ownerId).map((lobby) => ({
      lobby,
      score: calculateLobbyCompatibility(currentProfile, lobby, lobbyProfileByUser)
    }));

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
