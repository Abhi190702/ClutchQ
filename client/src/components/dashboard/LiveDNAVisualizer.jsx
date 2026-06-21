import ScoreRing from "../common/ScoreRing";
import EmptyState from "../common/EmptyState";

const LiveDNAVisualizer = ({ breakdown = [], totalScore = 0 }) => {
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
    <div className="card p-5">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-clutch-text">Top match breakdown</h3>
          <p className="mt-1 text-sm text-clutch-muted">A plain view of why the top recommendation is a good fit.</p>
        </div>
        <ScoreRing score={totalScore} label="Match" />
      </div>
      <div className="space-y-2">
        {breakdown.map((item, index) => {
          const score = Math.max(0, Math.min(100, Number(item.score) || 0));
          return (
          <div
            key={item.key}
            className="flex items-center justify-between rounded-md border border-clutch-border bg-clutch-panelSoft p-3 text-clutch-text"
            style={{ animationDelay: `${index * 60}ms` }}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold">{item.label}</span>
                <span className="text-sm font-semibold">+{score}</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/25">
                <div className="h-full rounded-full bg-clutch-blue transition-all duration-700" style={{ width: `${score}%` }} />
              </div>
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
};

export default LiveDNAVisualizer;
