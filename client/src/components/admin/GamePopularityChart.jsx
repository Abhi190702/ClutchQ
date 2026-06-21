import EmptyState from "../common/EmptyState";
import { formatNumber, safeNumber } from "../../utils/formatters";

const GamePopularityChart = ({ data = [] }) => {
  const rows = data.map((item) => ({
    label: item.label || "Unknown game",
    value: Math.max(0, safeNumber(item.value, 0))
  }));
  const max = Math.max(...rows.map((item) => item.value), 0);

  if (!rows.length || max === 0) {
    return (
      <div className="card p-5">
        <EmptyState compact title="No game activity yet." description="Game popularity will appear after players create rooms or track sessions." />
      </div>
    );
  }

  return (
    <div className="card p-5">
      <h3 className="mb-4 text-lg font-semibold">Game popularity</h3>
      <div className="space-y-3">
        {rows.map((item) => {
          const percent = max > 0 ? Math.min(100, Math.max(0, (item.value / max) * 100)) : 0;
          const width = item.value > 0 ? `${Math.max(2, percent)}%` : "0%";

          return (
          <div key={item.label}>
            <div className="mb-1 flex justify-between text-sm">
              <span className="font-semibold text-clutch-text">{item.label}</span>
              <span className="text-clutch-muted">{formatNumber(item.value)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-clutch-panelSoft">
              <div className="h-full rounded-full bg-clutch-blue" style={{ width }} />
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
};

export default GamePopularityChart;
