import ScoreRing from "../common/ScoreRing";

const LiveDNAVisualizer = ({ breakdown = [], totalScore = 0 }) => {
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
        {breakdown.map((item) => (
          <div
            key={item.key}
            className="flex items-center justify-between rounded-md border border-clutch-border bg-clutch-panelSoft p-3 text-clutch-text"
          >
            <span className="text-sm font-semibold">{item.label}</span>
            <span className="text-sm font-semibold">+{item.score}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LiveDNAVisualizer;
