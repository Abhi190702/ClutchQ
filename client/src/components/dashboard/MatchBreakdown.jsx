import { useEffect, useState } from "react";
import EmptyState from "../common/EmptyState";

const statusTone = {
  matched: "text-green-200 border-clutch-green/30 bg-clutch-green/10",
  partial: "text-amber-100 border-clutch-amber/30 bg-clutch-amber/10",
  warning: "text-red-100 border-clutch-red/30 bg-clutch-red/10"
};

const clampScore = (value) => Math.max(0, Math.min(100, Number(value) || 0));

const normalizeBreakdownItem = (item = {}) => {
  const score = clampScore(item.score);
  const max = Math.max(0, Number(item.max) || 100);

  return {
    key: item.key || item.label || item.reason || JSON.stringify(item),
    label: item.label || item.title || "Match signal",
    score,
    max,
    status: item.status,
    reason: item.reason || item.message || item.description || ""
  };
};

const MatchBreakdown = ({ match }) => {
  const [mounted, setMounted] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const breakdown = (match?.breakdown || []).map(normalizeBreakdownItem);

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
  }, [match]);

  if (!breakdown.length) {
    return (
      <EmptyState
        compact
        title="Run Find Squad Now to see the match explanation."
        description="Role, region, rank, mic, and timing signals will appear here after a recommendation is available."
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-2">
        {breakdown.map((item, index) => {
          const revealDelay = reduceMotion ? "0ms" : `${index * 90}ms`;
          const barDelay = reduceMotion ? "0ms" : `${index * 90 + 120}ms`;
          const percent = item.max > 0 ? Math.max(0, Math.min(100, (item.score / item.max) * 100)) : 0;

          return (
          <div
            key={item.key}
            className={`rounded-lg border border-clutch-border bg-clutch-panelSoft p-3 transition-all duration-500 ${mounted ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`}
            style={{ transitionDelay: revealDelay }}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-bold text-clutch-text">{item.label}</div>
              <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${statusTone[item.status] || statusTone.partial}`}>
                +{item.score}/{item.max}
              </span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/25">
              <div
                className="h-full rounded-full bg-clutch-blue transition-all duration-700"
                style={{
                  width: mounted || reduceMotion ? `${percent}%` : "0%",
                  transitionDelay: barDelay
                }}
              />
            </div>
            {item.reason ? <p className="mt-1 text-xs leading-5 text-clutch-muted">{item.reason}</p> : null}
          </div>
          );
        })}
      </div>
      {!!match?.warnings?.length && (
        <div className="rounded-lg border border-clutch-amber/40 bg-clutch-amber/10 p-3 text-xs text-amber-100">
          <div className="mb-1 font-semibold">Warnings</div>
          {match.warnings.map((warning) => (
            <div key={warning}>{warning}</div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MatchBreakdown;
