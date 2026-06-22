import { useState } from "react";
import DetailDrawer from "../common/DetailDrawer";
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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const breakdown = score?.breakdown || {};
  const topTraits = Object.entries(breakdown)
    .sort((a, b) => (b[1] || 0) - (a[1] || 0))
    .slice(0, 3);
  const chips = Object.entries(labels).slice(0, 4);
  const fullBreakdown = Object.entries(labels);

  return (
    <section className="border-b border-white/10 py-6 md:py-8">
      <div className="grid gap-6 lg:grid-cols-[128px_minmax(0,1fr)_auto] lg:items-center">
        <div className="flex justify-center lg:justify-start">
          <ScoreRing score={score?.overall || 0} size={118} label="Score" />
        </div>
        <div>
          <div className="eyebrow">Player score</div>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-clutch-text">ClutchQ Score {Math.round(score?.overall || 0)}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-clutch-muted">
            {score?.explanation || "Reliable teammate profile signals improve as Steam depth, completed rooms, and teammate reviews grow."}
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {topTraits.map(([key, value]) => (
              <div key={key} className="border-l border-white/10 pl-3">
                <div className="text-2xl font-black text-clutch-text">{Math.round(value || 0)}</div>
                <div className="mt-1 text-xs font-semibold text-clutch-muted">{labels[key] || key}</div>
              </div>
            ))}
          </div>
        </div>
        <button type="button" className="btn-secondary h-fit" onClick={() => setDrawerOpen(true)}>
          View full breakdown
        </button>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {chips.map(([key, label]) => (
          <span key={key} className="rounded-full bg-white/[0.055] px-3 py-1.5 text-xs font-semibold text-clutch-muted">
            {label} <span className="ml-1 font-black text-clutch-text">{Math.round(breakdown[key] || 0)}</span>
          </span>
        ))}
      </div>

      <DetailDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Player score breakdown"
        subtitle="The full set of signals behind this ClutchQ score."
      >
        <div className="space-y-3">
          {fullBreakdown.map(([key, label]) => (
            <div key={key} className="border-b border-white/10 pb-3 last:border-b-0">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-bold text-clutch-text">{label}</span>
                <span className="text-sm font-black text-clutch-blue">{Math.round(breakdown[key] || 0)}</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                <div className="h-full rounded-full bg-clutch-blue" style={{ width: `${Math.max(0, Math.min(100, Math.round(breakdown[key] || 0)))}%` }} />
              </div>
            </div>
          ))}
        </div>
      </DetailDrawer>
    </section>
  );
};

export default PlayerScoreStory;
