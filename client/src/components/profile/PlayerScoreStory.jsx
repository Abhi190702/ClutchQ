import ScoreRing from "../common/ScoreRing";

const labels = {
  gameDepth: "Game depth",
  recentActivity: "Recent activity",
  gameDiversity: "Game diversity",
  achievementScore: "Achievements",
  teamReliability: "Reliability",
  communication: "Communication",
  matchConsistency: "Consistency"
};

const PlayerScoreStory = ({ score }) => {
  const breakdown = score?.breakdown || {};
  const topTraits = Object.entries(breakdown)
    .sort((a, b) => (b[1] || 0) - (a[1] || 0))
    .slice(0, 3);
  const chips = Object.entries(labels).slice(0, 7);

  return (
    <section className="rounded-md border border-white/10 bg-[#1b1b20] p-5 md:p-6">
      <div className="grid gap-6 lg:grid-cols-[170px_minmax(0,1fr)] lg:items-center">
        <div className="flex justify-center lg:justify-start">
          <ScoreRing score={score?.overall || 0} size={150} label="Score" />
        </div>
        <div>
          <div className="eyebrow">Player score</div>
          <h2 className="mt-2 text-2xl font-black text-clutch-text">ClutchQ Score {Math.round(score?.overall || 0)}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-clutch-muted">
            {score?.explanation || "Reliable teammate profile signals improve as Steam depth, completed rooms, and teammate reviews grow."}
          </p>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {topTraits.map(([key, value]) => (
              <div key={key} className="rounded-md bg-black/15 p-3">
                <div className="text-xl font-black text-clutch-text">{Math.round(value || 0)}</div>
                <div className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-clutch-muted">{labels[key] || key}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {chips.map(([key, label]) => (
          <span key={key} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-clutch-muted">
            {label} <span className="ml-1 font-black text-clutch-text">{Math.round(breakdown[key] || 0)}</span>
          </span>
        ))}
      </div>
    </section>
  );
};

export default PlayerScoreStory;
