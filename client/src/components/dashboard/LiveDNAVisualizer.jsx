import { useEffect, useState } from "react";
import ScoreRing from "../common/ScoreRing";
import EmptyState from "../common/EmptyState";

const clampScore = (value) => Math.max(0, Math.min(100, Number(value) || 0));

const LiveDNAVisualizer = ({ breakdown = [], totalScore = 0 }) => {
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

  return (
    <section className="border-b border-white/10 pb-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <div className="eyebrow mb-2">Match read</div>
          <h3 className="text-xl font-black text-clutch-text">Top match breakdown</h3>
          <p className="mt-1 text-sm text-clutch-muted">A plain view of why the top recommendation is a good fit.</p>
        </div>
        <ScoreRing score={totalScore} label="Match" />
      </div>
      <div className="space-y-2">
        {breakdown.map((item, index) => {
          const score = clampScore(item.score);
          const revealDelay = reduceMotion ? "0ms" : `${index * 90}ms`;
          const barDelay = reduceMotion ? "0ms" : `${index * 90 + 120}ms`;

          return (
          <div
            key={item.key}
            className={`flex items-center justify-between border-b border-white/10 py-3 text-clutch-text transition-all duration-500 last:border-b-0 ${mounted ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`}
            style={{ transitionDelay: revealDelay }}
          >
            <div className="min-w-0 flex-1">
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
          </div>
          );
        })}
      </div>
    </section>
  );
};

export default LiveDNAVisualizer;
