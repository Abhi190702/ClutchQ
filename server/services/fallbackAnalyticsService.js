const clamp = (value, min = 0, max = 100) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.max(min, Math.min(max, Math.round(number)));
};

const average = (values, fallback = 0) => {
  const clean = values.map(Number).filter(Number.isFinite);
  return clean.length ? clean.reduce((sum, value) => sum + value, 0) / clean.length : fallback;
};

const resultBonus = (result) => {
  if (result === "win") return 10;
  if (result === "loss") return -4;
  return 2;
};

export const fallbackAnalyzeScorecard = (payload = {}) => {
  const manual = payload.manualStats || {};
  const session = payload.session || {};
  const feedback = payload.feedbackSummary || {};
  const kills = Number(manual.kills) || 0;
  const deaths = Number(manual.deaths) || 0;
  const assists = Number(manual.assists) || 0;
  const damage = Number(manual.damage) || 0;
  const score = Number(manual.score) || 0;
  const rating = Number(session.matchRating) || 72;
  const feedbackScore = average(
    [feedback.communication, feedback.teamwork, feedback.reliability, feedback.skill, feedback.behavior].map((value) => Number(value) * 20),
    72
  );
  const combat = clamp(58 + kills * 5 - deaths * 2.5 + assists * 2 + damage / 120 + score / 25);
  const support = clamp(assists * 8 + feedbackScore * 0.45);
  const survival = clamp(88 - deaths * 4 + resultBonus(manual.result || session.result));
  const objectiveFocus = clamp(62 + resultBonus(manual.result || session.result) + score / 25);
  const consistency = clamp(rating * 0.55 + feedbackScore * 0.45);
  const impact = clamp(combat * 0.55 + objectiveFocus * 0.25 + consistency * 0.2);
  const overall = clamp(combat * 0.25 + survival * 0.14 + support * 0.18 + objectiveFocus * 0.16 + consistency * 0.12 + impact * 0.15);

  return {
    success: true,
    task: "analyze_scorecard",
    data: {
      detectedGame: payload.gameName || "Unknown game",
      gameType: "general",
      extractedStats: {
        kills: manual.kills ?? null,
        deaths: manual.deaths ?? null,
        assists: manual.assists ?? null,
        damage: manual.damage ?? null,
        placement: manual.placement ?? null,
        score: manual.score ?? null,
        result: manual.result || session.result || "completed",
        durationMinutes: manual.durationMinutes || session.durationMinutes || 0
      },
      performance: { combat, survival, support, objectiveFocus, consistency, impact, overall },
      situationalSignals: {
        clutchPotential: clamp(impact * 0.55 + survival * 0.45),
        entryPressure: combat,
        teamSupport: support,
        objectiveFocus,
        pressureHandling: clamp(survival * 0.5 + consistency * 0.5),
        tiltResistance: consistency
      },
      summary: ["Lightweight analysis created from public session signals.", "Add scorecard stats and teammate feedback for stronger confidence."],
      warnings: ["Python worker unavailable. Used fallback analyzer."],
      confidence: payload.manualStats ? 0.64 : 0.46
    },
    warnings: ["Python worker unavailable. Used fallback analyzer."],
    confidence: payload.manualStats ? 0.64 : 0.46,
    source: "fallback"
  };
};

export const fallbackBuildRhythm = (payload = {}) => {
  const sessions = payload.sessions || [];
  const totalsByGame = new Map();
  let totalMinutes = 0;
  const byDate = new Map();

  sessions.forEach((session) => {
    const minutes = Number(session.durationMinutes) || 0;
    totalMinutes += minutes;
    const gameName = session.gameName || "Session";
    totalsByGame.set(gameName, (totalsByGame.get(gameName) || 0) + minutes);
    const date = String(session.startedAt || new Date().toISOString()).slice(0, 10);
    const current = byDate.get(date) || { date, label: date.slice(5), minutes: 0, games: [] };
    current.minutes += minutes;
    current.games.push({ gameName, minutes });
    byDate.set(date, current);
  });

  const series = Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date)).slice(-56);
  const gameMix = Array.from(totalsByGame.entries())
    .map(([gameName, minutes]) => ({
      gameSlug: gameName.toLowerCase().replace(/\s+/g, "-"),
      gameName,
      minutes,
      share: clamp((minutes / Math.max(1, totalMinutes)) * 100)
    }))
    .sort((a, b) => b.minutes - a.minutes);

  return {
    success: true,
    task: "build_rhythm",
    data: {
      summary: {
        totalMinutes,
        activeDays: series.filter((day) => day.minutes > 0).length,
        bestDayMinutes: Math.max(0, ...series.map((day) => day.minutes)),
        currentStreak: 0,
        bestStreak: 0,
        dominantGame: gameMix[0]?.gameName || "Not synced yet",
        dominantGameShare: gameMix[0]?.share || 0,
        rhythmScore: clamp(series.length * 6 + totalMinutes / 90)
      },
      series,
      gameMix,
      insights: totalMinutes ? ["Your rhythm is based on tracked ClutchQ sessions."] : ["Start or sync sessions to build rhythm insights."],
      confidence: totalMinutes ? 0.52 : 0.34
    },
    warnings: ["Python worker unavailable. Used fallback analyzer."],
    confidence: totalMinutes ? 0.52 : 0.34,
    source: "fallback"
  };
};

export const fallbackRebuildGameplayGraph = (payload = {}) => {
  const sessions = payload.sessions || [];
  const scorecards = payload.scorecardAnalyses || [];
  const feedback = payload.feedbackReceived || [];
  const steam = payload.steamLibrary || [];
  const scorecardScore = average(scorecards.map((item) => item.performance?.overall), 62);
  const sessionScore = clamp(sessions.length * 6 + average(sessions.map((item) => item.matchRating), 65) * 0.45);
  const feedbackScore = average(
    feedback.map((item) => average(Object.values(item.ratings || {}), 3.5) * 20),
    70
  );
  const steamScore = clamp(steam.reduce((sum, game) => sum + (Number(game.playtimeForeverMinutes) || 0), 0) / 300);
  const gameplayProfileScore = clamp(steamScore * 0.2 + sessionScore * 0.2 + scorecardScore * 0.2 + feedbackScore * 0.2 + 68 * 0.2);

  return {
    success: true,
    task: "rebuild_gameplay_graph",
    data: {
      gameplayProfileScore,
      confidence: sessions.length || scorecards.length ? 0.56 : 0.36,
      style: {
        mainStyle: feedbackScore >= scorecardScore ? "Structured support" : "Impact flex",
        competitiveTendency: clamp(scorecardScore),
        cooperativeTendency: clamp(feedbackScore),
        riskProfile: "Balanced",
        bestSquadFit: "Ranked squad with clear roles and comms"
      },
      gameProfiles: [],
      situationalStrengths: [
        { key: "teamSupport", label: "Team support", score: clamp(feedbackScore), evidence: "Based on teammate feedback and sessions." },
        { key: "consistency", label: "Consistency", score: clamp(sessionScore), evidence: "Based on completed ClutchQ activity." }
      ],
      teammateEdges: [],
      recommendations: ["Add scorecards and teammate feedback to improve confidence."]
    },
    warnings: ["Python worker unavailable. Used fallback analyzer."],
    confidence: sessions.length || scorecards.length ? 0.56 : 0.36,
    source: "fallback"
  };
};

export const fallbackComputeTeammateFit = (payload = {}) => {
  const candidates = payload.candidateProfiles || [];
  return {
    success: true,
    task: "compute_teammate_fit",
    data: {
      matches: candidates.slice(0, 12).map((profile) => ({
        userId: String(profile.userId?._id || profile.userId || profile._id),
        name: profile.displayName || profile.userId?.name || "ClutchQ player",
        compatibility: 70,
        confidence: 0.42,
        sharedGames: (profile.games || []).slice(0, 2).map((game) => game.gameName),
        reasons: ["Basic profile compatibility available."],
        warnings: ["Low confidence: gameplay graph is still building."]
      }))
    },
    warnings: ["Python worker unavailable. Used fallback analyzer."],
    confidence: 0.42,
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
