const clamp = (value, min = 0, max = 100) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.max(min, Math.min(max, Math.round(number)));
};

const numberOrNull = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const average = (values, fallback = null) => {
  const clean = values.map(numberOrNull).filter((value) => value !== null);
  return clean.length ? clean.reduce((sum, value) => sum + value, 0) / clean.length : fallback;
};

const objectId = (value) => String(value?._id || value?.id || value || "");

const buildTeammateEdges = (payload = {}) => {
  const viewerId = objectId(payload.user?._id);
  const edges = new Map();
  const ensureEdge = (userId, name = "ClutchQ teammate") => {
    const key = objectId(userId);
    if (!key || key === viewerId) return null;
    if (!edges.has(key)) {
      edges.set(key, { userId: key, name, sharedLobbyCount: 0, sharedGames: new Set(), feedbackScores: [] });
    }
    const edge = edges.get(key);
    if (name && edge.name === "ClutchQ teammate") edge.name = name;
    return edge;
  };

  (payload.lobbies || []).slice(0, 40).forEach((lobby) => {
    (lobby.currentMembers || []).forEach((member) => {
      const memberUser = member.userId || member;
      const edge = ensureEdge(memberUser, memberUser?.name || member.name);
      if (!edge) return;
      edge.sharedLobbyCount += 1;
      if (lobby.game) edge.sharedGames.add(String(lobby.game));
    });
  });

  const addFeedback = (items, idField) => {
    (items || []).forEach((item) => {
      const edge = ensureEdge(item[idField]);
      const rating = average(Object.values(item.ratings || {}));
      if (edge && rating !== null) edge.feedbackScores.push(rating * 20);
    });
  };
  addFeedback(payload.feedbackReceived, "fromUserId");
  addFeedback(payload.feedbackGiven, "toUserId");

  return [...edges.values()].map((edge) => {
    const feedbackScore = average(edge.feedbackScores);
    const historySignal = edge.sharedLobbyCount ? Math.min(70, 50 + (edge.sharedLobbyCount - 1) * 8) : null;
    const compatibility = clamp(weightedAverage([[feedbackScore, 0.8], [historySignal, 0.2]], 0));
    const lobbyLabel = edge.sharedLobbyCount === 1 ? "lobby" : "lobbies";
    return {
      userId: edge.userId,
      name: edge.name,
      compatibility,
      sharedGames: [...edge.sharedGames].slice(0, 3),
      reason: feedbackScore !== null
        ? `Based on teammate feedback${edge.sharedLobbyCount ? ` and ${edge.sharedLobbyCount} completed shared ${lobbyLabel}` : ""}.`
        : `${edge.sharedLobbyCount} completed shared ${lobbyLabel}.`
    };
  }).sort((left, right) => right.compatibility - left.compatibility).slice(0, 80);
};

const weightedAverage = (items, fallback = null) => {
  const known = items.filter(([value]) => value !== null && value !== undefined && Number.isFinite(Number(value)));
  if (!known.length) return fallback;
  const totalWeight = known.reduce((sum, [, weight]) => sum + weight, 0);
  return known.reduce((sum, [value, weight]) => sum + Number(value) * weight, 0) / totalWeight;
};

const resultBonus = (result) => {
  const normalized = String(result || "").toLowerCase();
  if (["win", "won"].includes(normalized)) return 10;
  if (["loss", "lost"].includes(normalized)) return -4;
  return 0;
};

const dayKey = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
};

const formatDay = (key) => {
  const date = new Date(`${key}T00:00:00.000Z`);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
};

const addUtcDays = (date, days) => new Date(date.getTime() + days * 86400000);

const calculateStreaks = (series) => {
  const active = new Set(series.filter((day) => day.minutes > 0).map((day) => day.date));
  let best = 0;
  let running = 0;
  series.forEach((day) => {
    running = day.minutes > 0 ? running + 1 : 0;
    best = Math.max(best, running);
  });

  let cursor = new Date();
  cursor.setUTCHours(0, 0, 0, 0);
  let current = 0;
  if (!active.has(cursor.toISOString().slice(0, 10))) cursor = addUtcDays(cursor, -1);
  while (active.has(cursor.toISOString().slice(0, 10))) {
    current += 1;
    cursor = addUtcDays(cursor, -1);
  }
  return { current, best };
};

export const fallbackAnalyzeScorecard = (payload = {}) => {
  const manual = payload.manualStats || {};
  const session = payload.session || {};
  const feedback = payload.feedbackSummary || {};
  const numeric = (field) => numberOrNull(manual[field]);
  const kills = numeric("kills");
  const deaths = numeric("deaths");
  const assists = numeric("assists");
  const damage = numeric("damage");
  const score = numeric("score");
  const placement = numeric("placement");
  const revives = numeric("revives");
  const duration = numberOrNull(manual.durationMinutes ?? session.durationMinutes);
  const rating = numberOrNull(session.matchRating);
  const result = manual.result || session.result;
  const knownResult = ["win", "won", "loss", "lost"].includes(String(result || "").toLowerCase());
  const feedbackScore = average(
    [feedback.communication, feedback.teamwork, feedback.reliability, feedback.skill, feedback.behavior].map((value) => {
      const number = numberOrNull(value);
      return number === null ? null : number * 20;
    })
  );

  const hasCombat = [kills, deaths, assists, damage, score].some((value) => value !== null);
  const combat = hasCombat
    ? clamp(18 + (kills || 0) * 6 - Math.max(0, deaths || 0) * 3 + (assists || 0) * 2.5 + (damage || 0) / 110 + (score || 0) / 30)
    : null;
  const survival = deaths !== null || duration !== null || placement !== null || knownResult
    ? clamp(38 - Math.max(0, deaths || 0) * 5 + Math.min(24, Math.max(0, duration || 0) / 5) + (placement && placement <= 3 ? 38 : placement && placement <= 10 ? 24 : 0) + resultBonus(result))
    : null;
  const support = assists !== null || revives !== null || feedbackScore !== null
    ? clamp((assists || 0) * 8 + (revives || 0) * 12 + (feedbackScore || 0) * 0.55)
    : null;
  const objectiveFocus = score !== null || placement !== null || knownResult
    ? clamp((score || 0) / 22 + (placement && placement <= 3 ? 35 : placement && placement <= 10 ? 20 : 0) + 42 + resultBonus(result))
    : null;
  const consistency = weightedAverage([[rating, 0.6], [feedbackScore, 0.4]]);
  const impact = weightedAverage([[combat, 0.45], [objectiveFocus, 0.25], [survival, 0.15], [support, 0.15]]);
  const overall = clamp(weightedAverage([
    [combat, 0.25],
    [survival, 0.14],
    [support, 0.18],
    [objectiveFocus, 0.16],
    [consistency, 0.12],
    [impact, 0.15]
  ], 0));
  const hasEvidence = [combat, survival, support, objectiveFocus, consistency].some((value) => value !== null);
  let confidence = 0;
  if (hasCombat || placement !== null || score !== null) confidence += 0.42;
  if (rating !== null || knownResult || duration !== null) confidence += 0.14;
  if (feedbackScore !== null) confidence += 0.18;

  const warnings = ["Python worker unavailable. Used fallback analyzer."];
  if (payload.scorecardMeta?.hasImage && !payload.scorecardMeta?.ocrText) {
    warnings.push("Image OCR is not configured; the image itself was not used to calculate scores.");
  }
  if (!hasEvidence) warnings.push("Add structured match stats, a rating, or teammate feedback to calculate performance.");

  return {
    success: true,
    task: "analyze_scorecard",
    data: {
      detectedGame: payload.gameName || "Unknown game",
      gameType: "general",
      extractedStats: {
        kills,
        deaths,
        assists,
        damage,
        placement,
        score,
        result: result || "completed",
        durationMinutes: duration || 0
      },
      performance: {
        combat: clamp(combat || 0),
        survival: clamp(survival || 0),
        support: clamp(support || 0),
        objectiveFocus: clamp(objectiveFocus || 0),
        consistency: clamp(consistency || 0),
        impact: clamp(impact || 0),
        overall
      },
      situationalSignals: {
        clutchPotential: clamp(weightedAverage([[impact, 0.55], [survival, 0.45]], 0)),
        entryPressure: clamp(combat || 0),
        teamSupport: clamp(support || 0),
        objectiveFocus: clamp(objectiveFocus || 0),
        pressureHandling: clamp(weightedAverage([[survival, 0.5], [consistency, 0.5]], 0)),
        tiltResistance: clamp(consistency || 0)
      },
      summary: [hasEvidence ? "Analysis uses only the structured signals supplied for this session." : "Not enough measurable gameplay data was supplied for a performance score."],
      warnings,
      confidence: Math.min(0.9, confidence)
    },
    warnings,
    confidence: Math.min(0.9, confidence),
    source: "fallback"
  };
};

export const fallbackBuildRhythm = (payload = {}) => {
  const sessions = Array.isArray(payload.sessions) ? payload.sessions : [];
  const steamHeatmap = Array.isArray(payload.steamHeatmap) ? payload.steamHeatmap : [];
  const steamLibrary = Array.isArray(payload.steamLibrary) ? payload.steamLibrary : [];
  const byDate = new Map();
  const totalsByGame = new Map();

  const addDay = (date, gameName, minutes) => {
    const key = dayKey(date);
    const safeMinutes = Math.max(0, Number(minutes) || 0);
    if (!key || safeMinutes <= 0) return;
    const current = byDate.get(key) || { minutes: 0, games: new Map() };
    current.minutes += safeMinutes;
    current.games.set(gameName, (current.games.get(gameName) || 0) + safeMinutes);
    byDate.set(key, current);
    totalsByGame.set(gameName, (totalsByGame.get(gameName) || 0) + safeMinutes);
  };

  steamHeatmap.forEach((day) => {
    const games = Array.isArray(day.games) ? day.games : [];
    if (games.length) games.forEach((game) => addDay(day.date, game.gameName || game.name || "Steam", game.minutes));
    else addDay(day.date, "Steam", day.totalMinutes);
  });
  sessions.forEach((session) => addDay(session.startedAt, session.gameName || "Session", session.durationMinutes));
  steamLibrary.forEach((game) => {
    const name = game.gameName || game.name;
    const recentMinutes = Math.max(0, Number(game.playtimeLastTwoWeeksMinutes) || 0);
    if (name && recentMinutes > 0) totalsByGame.set(name, Math.max(totalsByGame.get(name) || 0, recentMinutes));
  });

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const knownDates = [...byDate.keys()].map((key) => new Date(`${key}T00:00:00.000Z`));
  const latestKnown = knownDates.length ? new Date(Math.max(...knownDates.map((date) => date.getTime()))) : today;
  const end = latestKnown > today ? latestKnown : today;
  const start = addUtcDays(end, -55);
  const series = Array.from({ length: 56 }, (_, index) => {
    const date = addUtcDays(start, index);
    const key = date.toISOString().slice(0, 10);
    const day = byDate.get(key);
    return {
      date: key,
      label: formatDay(key),
      minutes: Math.round(day?.minutes || 0),
      games: day
        ? [...day.games.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([gameName, minutes]) => ({ gameName, minutes: Math.round(minutes) }))
        : []
    };
  });
  const totalMinutes = series.reduce((sum, day) => sum + day.minutes, 0);
  const gameTotal = [...totalsByGame.values()].reduce((sum, minutes) => sum + minutes, 0) || 1;
  const gameMix = [...totalsByGame.entries()]
    .map(([gameName, minutes]) => ({
      gameSlug: gameName.toLowerCase().replace(/\s+/g, "-"),
      gameName,
      minutes: Math.round(minutes),
      share: clamp((minutes / gameTotal) * 100)
    }))
    .filter((game) => game.minutes > 0)
    .sort((a, b) => b.minutes - a.minutes)
    .slice(0, 8);
  const streaks = calculateStreaks(series);
  const activeDays = series.filter((day) => day.minutes > 0).length;
  const warnings = ["Python worker unavailable. Used fallback analyzer."];
  if (!totalMinutes && gameMix.length) warnings.push("Steam recent playtime has no per-day timestamps, so it is shown only in the game mix.");
  const confidence = Math.min(0.84, (sessions.length ? 0.42 : 0) + (steamHeatmap.length ? 0.3 : 0) + (gameMix.length ? 0.08 : 0));

  return {
    success: true,
    task: "build_rhythm",
    data: {
      summary: {
        totalMinutes,
        activeDays,
        bestDayMinutes: Math.max(0, ...series.map((day) => day.minutes)),
        currentStreak: streaks.current,
        bestStreak: streaks.best,
        dominantGame: gameMix[0]?.gameName || "Not synced yet",
        dominantGameShare: gameMix[0]?.share || 0,
        rhythmScore: clamp((activeDays / 30) * 65 + Math.min(35, totalMinutes / 120))
      },
      series,
      gameMix,
      insights: totalMinutes ? ["Your rhythm is based on dated ClutchQ activity."] : ["Track sessions to build a dated rhythm read."],
      warnings,
      confidence
    },
    warnings,
    confidence,
    source: "fallback"
  };
};

export const fallbackRebuildGameplayGraph = (payload = {}) => {
  const sessions = Array.isArray(payload.sessions) ? payload.sessions : [];
  const scorecards = Array.isArray(payload.scorecardAnalyses) ? payload.scorecardAnalyses : [];
  const feedback = Array.isArray(payload.feedbackReceived) ? payload.feedbackReceived : [];
  const steam = Array.isArray(payload.steamLibrary) ? payload.steamLibrary : [];
  const achievements = Array.isArray(payload.steamAchievements) ? payload.steamAchievements : [];
  const scorecardScore = scorecards.length ? average(scorecards.map((item) => item.performance?.overall)) : null;
  const sessionScore = sessions.length ? clamp(sessions.length * 3 + (average(sessions.map((item) => item.matchRating), 0) || 0) * 0.55) : null;
  const feedbackScore = feedback.length
    ? average(feedback.map((item) => {
        const rating = average(Object.values(item.ratings || {}));
        return rating === null ? null : rating * 20;
      }))
    : null;
  const steamScore = steam.length ? clamp(steam.reduce((sum, game) => sum + (Number(game.playtimeForeverMinutes) || 0), 0) / 300) : null;
  const achievementScore = achievements.length ? clamp((achievements.filter((item) => item.achieved).length / achievements.length) * 100) : null;
  const gameplayProfileScore = clamp(weightedAverage([
    [steamScore, 0.2],
    [achievementScore, 0.05],
    [sessionScore, 0.25],
    [scorecardScore, 0.25],
    [feedbackScore, 0.25]
  ], 0));
  const hasPerformanceEvidence = scorecardScore !== null || feedbackScore !== null;
  let confidence = 0;
  if (sessions.length) confidence += 0.22;
  if (scorecards.length) confidence += 0.24;
  if (feedback.length) confidence += 0.2;
  if (steam.length) confidence += 0.14;
  if (achievements.length) confidence += 0.06;

  return {
    success: true,
    task: "rebuild_gameplay_graph",
    data: {
      gameplayProfileScore,
      confidence: Math.min(0.9, confidence),
      style: {
        mainStyle: !hasPerformanceEvidence ? "Profile still forming" : feedbackScore !== null && (scorecardScore === null || feedbackScore >= scorecardScore) ? "Structured support" : "Impact flex",
        competitiveTendency: clamp(scorecardScore || 0),
        cooperativeTendency: clamp(feedbackScore || 0),
        riskProfile: confidence >= 0.45 ? "Balanced" : "Not enough data",
        bestSquadFit: gameplayProfileScore >= 70 ? "Ranked squad with clear roles and comms" : "Build more tracked sessions for a reliable squad fit"
      },
      gameProfiles: [],
      situationalStrengths: [
        ...(feedbackScore === null ? [] : [{ key: "teamSupport", label: "Team support", score: clamp(feedbackScore), evidence: "Based on teammate feedback." }]),
        ...(sessionScore === null ? [] : [{ key: "consistency", label: "Consistency", score: clamp(sessionScore), evidence: "Based on completed ClutchQ activity." }])
      ],
      teammateEdges: buildTeammateEdges(payload),
      recommendations: [
        ...(!sessions.length ? ["Track a completed session to improve activity confidence."] : []),
        ...(!scorecards.length ? ["Add structured match stats to unlock performance signals."] : [])
      ]
    },
    warnings: ["Python worker unavailable. Used fallback analyzer."],
    confidence: Math.min(0.9, confidence),
    source: "fallback"
  };
};

export const fallbackComputeTeammateFit = (payload = {}) => {
  const profiles = Array.isArray(payload.candidateProfiles) ? payload.candidateProfiles : [];
  const graphs = new Map((payload.candidateGraphs || []).map((graph) => [String(graph.userId || ""), graph]));
  const viewerGraph = payload.viewerGraph || {};
  const viewerGames = new Set((viewerGraph.gameProfiles || []).map((game) => game.gameName).filter(Boolean));
  const edges = new Map((viewerGraph.teammateEdges || []).map((edge) => [String(edge.userId || ""), edge]));
  const matches = profiles.slice(0, 24).map((profile) => {
    const userId = String(profile.userId?._id || profile.userId || profile._id || "");
    const graph = graphs.get(userId) || {};
    const candidateGames = new Set((graph.gameProfiles || []).map((game) => game.gameName).filter(Boolean));
    const sharedGames = [...viewerGames].filter((game) => candidateGames.has(game));
    const overlap = viewerGames.size && candidateGames.size ? Math.min(100, (sharedGames.length / Math.min(viewerGames.size, candidateGames.size)) * 100) : null;
    const edge = edges.get(userId);
    const graphQuality = viewerGraph.gameplayProfileScore !== undefined && graph.gameplayProfileScore !== undefined
      ? average([viewerGraph.gameplayProfileScore, graph.gameplayProfileScore])
      : null;
    const trust = numberOrNull(profile.trustScore);
    const evidence = [[overlap, 0.35], [numberOrNull(edge?.compatibility), 0.25], [graphQuality, 0.25], [trust, 0.15]];
    const evidenceCount = evidence.filter(([value]) => value !== null).length;
    const compatibility = clamp(weightedAverage(evidence, 0));
    return {
      userId,
      name: profile.displayName || profile.userId?.name || "ClutchQ player",
      compatibility,
      confidence: Math.min(
        0.82,
        Math.min(Number(viewerGraph.confidence) || 0, Number(graph.confidence) || 0) + evidenceCount * 0.08
      ),
      sharedGames: sharedGames.slice(0, 3),
      reasons: sharedGames.length ? ["Shared game profile."] : ["More shared activity is needed for a reliable match explanation."],
      warnings: evidenceCount ? ["Python worker unavailable. Fit uses bounded fallback signals."] : ["No shared evidence is available yet."]
    };
  });

  return {
    success: true,
    task: "compute_teammate_fit",
    data: { matches: matches.sort((a, b) => b.compatibility - a.compatibility).slice(0, 12) },
    warnings: ["Python worker unavailable. Used fallback analyzer."],
    confidence: matches.length ? Math.max(...matches.map((match) => match.confidence)) : 0,
    source: "fallback"
  };
};

export const runFallbackTask = (task, payload) => {
  if (task === "analyze_scorecard") return fallbackAnalyzeScorecard(payload);
  if (task === "build_rhythm") return fallbackBuildRhythm(payload);
  if (task === "rebuild_gameplay_graph") return fallbackRebuildGameplayGraph(payload);
  if (task === "compute_teammate_fit") return fallbackComputeTeammateFit(payload);
  return {
    success: false,
    task,
    message: "Unsupported analytics task.",
    warnings: ["Python worker unavailable. Used fallback analyzer."],
    confidence: 0,
    source: "fallback"
  };
};
