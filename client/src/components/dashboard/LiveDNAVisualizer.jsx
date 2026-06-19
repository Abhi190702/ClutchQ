import { useEffect, useState } from "react";
import ScoreRing from "../common/ScoreRing";

const LiveDNAVisualizer = ({ breakdown = [], totalScore = 0 }) => {
  const [activeIndex, setActiveIndex] = useState(-1);
  const visible = breakdown.slice(0, Math.max(0, activeIndex + 1));
  const runningScore = visible.reduce((sum, item) => sum + item.score, 0);

  useEffect(() => {
    setActiveIndex(-1);
    breakdown.forEach((_, index) => {
      window.setTimeout(() => setActiveIndex(index), 220 + index * 260);
    });
  }, [breakdown]);

  return (
    <div className="card p-5">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-black text-clutch-text">Live DNA Matchmaking Visualizer</h3>
          <p className="mt-1 text-sm text-clutch-muted">Criteria light up one by one as the score builds.</p>
        </div>
        <ScoreRing score={activeIndex >= breakdown.length - 1 ? totalScore : runningScore} label="DNA" />
      </div>
      <div className="space-y-2">
        {breakdown.map((item, index) => (
          <div
            key={item.key}
            className={`flex items-center justify-between rounded-lg border p-3 transition ${
              index <= activeIndex ? "border-clutch-cyan/50 bg-clutch-cyan/10 text-clutch-text" : "border-clutch-border bg-clutch-panelSoft text-clutch-muted"
            }`}
          >
            <span className="text-sm font-bold">{item.label}</span>
            <span className="text-sm font-black">+{index <= activeIndex ? item.score : 0}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LiveDNAVisualizer;
