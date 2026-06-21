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
    <section className="border-b border-white/10 py-8 md:py-10">
      <div className="grid gap-8 lg:grid-cols-[190px_minmax(0,1fr)] lg:items-center">
        <div className="flex justify-center lg:justify-start">
          <ScoreRing score={score?.overall || 0} size={168} label="Score" />
        </div>
        <div>
          <div className="eyebrow">Player score</div>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-clutch-text md:text-4xl">ClutchQ Score {Math.round(score?.overall || 0)}</h2>
          <p className="mt-4 max-w-3xl text-base leading-7 text-clutch-muted">
            {score?.explanation || "Reliable teammate profile signals improve as Steam depth, completed rooms, and teammate reviews grow."}
          </p>

          <div className="mt-7 grid divide-y divide-white/10 md:grid-cols-3 md:divide-x md:divide-y-0">
            {topTraits.map(([key, value]) => (
              <div key={key} className="py-3 md:px-5 first:md:pl-0">
                <div className="text-3xl font-black text-clutch-text">{Math.round(value || 0)}</div>
                <div className="mt-1 text-xs font-black uppercase tracking-[0.16em] text-clutch-muted">{labels[key] || key}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        {chips.map(([key, label]) => (
          <span key={key} className="rounded-full bg-white/[0.055] px-3 py-1.5 text-xs font-semibold text-clutch-muted">
            {label} <span className="ml-1 font-black text-clutch-text">{Math.round(breakdown[key] || 0)}</span>
          </span>
        ))}
      </div>
    </section>
  );
};

export default PlayerScoreStory;
