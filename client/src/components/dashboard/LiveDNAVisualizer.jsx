import { useEffect, useState } from "react";
import DetailDrawer from "../common/DetailDrawer";
import ScoreRing from "../common/ScoreRing";
import EmptyState from "../common/EmptyState";

const clampScore = (value) => Math.max(0, Math.min(100, Number(value) || 0));

const LiveDNAVisualizer = ({ breakdown = [], totalScore = 0 }) => {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const shouldReduce = Boolean(media?.matches);
    setReduceMotion(shouldReduce);
    setMounted(false);

    if (shouldReduce) {
      setMounted(true);
      return undefined;
    }

    const id = window.requestAnimationFrame(() => setMounted(true));
    return () => window.cancelAnimationFrame(id);
  }, [breakdown]);

  if (!breakdown.length) {
    return (
      <EmptyState
        eyebrow="Match read"
        title="No match breakdown yet"
        description="Create or join a lobby to see the factors behind your top squad recommendation."
      />
    );
  }

  const topReason = [...breakdown].sort((a, b) => clampScore(b.score) - clampScore(a.score))[0];

  return (
    <section className="border-b border-white/10 pb-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="eyebrow mb-2">Match read</div>
          <h3 className="text-xl font-black text-clutch-text">Top match summary</h3>
          <p className="mt-1 text-sm text-clutch-muted">
            Best fit: {topReason?.label || "role balance"} + {totalScore}% confidence.
          </p>
        </div>
        <ScoreRing score={totalScore} label="Match" size={76} />
      </div>
      <button type="button" className="btn-secondary mt-5" onClick={() => setOpen(true)}>
        View breakdown
      </button>

      <DetailDrawer open={open} onClose={() => setOpen(false)} title="Top match breakdown" subtitle="The factors behind this recommendation.">
        <div className="space-y-2">
          {breakdown.map((item, index) => {
            const score = clampScore(item.score);
            const revealDelay = reduceMotion ? "0ms" : `${index * 60}ms`;
            const barDelay = reduceMotion ? "0ms" : `${index * 60 + 100}ms`;

            return (
              <div
                key={item.key}
                className={`border-b border-white/10 py-3 text-clutch-text transition-all duration-500 last:border-b-0 ${mounted ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`}
                style={{ transitionDelay: revealDelay }}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold">{item.label}</span>
                  <span className="text-sm font-semibold">+{score}</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/25">
                  <div
                    className="h-full rounded-full bg-clutch-blue transition-all duration-700"
                    style={{
                      width: mounted || reduceMotion ? `${score}%` : "0%",
                      transitionDelay: barDelay
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </DetailDrawer>
    </section>
  );
};

export default LiveDNAVisualizer;
