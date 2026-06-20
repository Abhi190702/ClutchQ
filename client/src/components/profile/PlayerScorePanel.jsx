import ScoreRing from "../common/ScoreRing";

const labels = {
  gameDepth: "Game Depth",
  recentActivity: "Recent Activity",
  gameDiversity: "Game Diversity",
  achievementScore: "Achievement Score",
  teamReliability: "Team Reliability",
  communication: "Communication",
  matchConsistency: "Match Consistency"
};

const PlayerScorePanel = ({ score }) => {
  const breakdown = score?.breakdown || {};

  return (
    <section id="score" className="card p-5 md:p-6">
      <div className="flex flex-col gap-5 md:flex-row md:items-center">
        <div className="shrink-0">
          <ScoreRing score={score?.overall || 0} size={132} label="Score" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="eyebrow">Player score</div>
          <h2 className="mt-2 text-2xl font-bold text-clutch-text">ClutchQ Score {score?.overall ?? "--"}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-clutch-muted">
            {score?.explanation || "Powered by Steam playtime, achievements, ClutchQ sessions, lobby reliability, and teammate reviews."}
          </p>
        </div>
      </div>
      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {Object.entries(labels).map(([key, label]) => {
          const value = breakdown[key] || 0;
          return (
            <div key={key} className="rounded-md border border-clutch-border bg-clutch-bg/40 p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-clutch-text">{label}</span>
                <span className="font-bold text-clutch-text">{Math.round(value)}</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-clutch-panelSoft">
                <div className="h-full rounded-full bg-clutch-blue" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default PlayerScorePanel;
