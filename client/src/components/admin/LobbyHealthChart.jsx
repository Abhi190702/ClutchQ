import EmptyState from "../common/EmptyState";
import { formatNumber, safeNumber } from "../../utils/formatters";

const colors = {
  open: "#34D399",
  full: "#60A5FA",
  closed: "#FBBF24"
};

const LobbyHealthChart = ({ data = [] }) => {
  const rows = data.map((item) => ({
    label: item.label || "unknown",
    value: Math.max(0, safeNumber(item.value, 0))
  }));
  const total = rows.reduce((sum, item) => sum + item.value, 0);
  let offset = 0;

  if (!rows.length || total === 0) {
    return (
      <div className="card p-5">
        <EmptyState compact title="No lobby activity yet." description="Lobby health will appear after lobbies are created." />
      </div>
    );
  }

  return (
    <div className="card p-5">
      <h3 className="mb-4 text-lg font-semibold">Lobby health</h3>
      <svg viewBox="0 0 120 120" className="mx-auto h-44 w-44" role="img" aria-labelledby="lobby-health-title lobby-health-desc">
        <title id="lobby-health-title">Lobby health chart</title>
        <desc id="lobby-health-desc">Donut chart showing open, full, and closed lobbies.</desc>
        <circle cx="60" cy="60" r="44" fill="none" stroke="#28282D" strokeWidth="16" />
        <g transform="rotate(-90 60 60)">
          {rows.map((item) => {
            const dash = total > 0 ? (item.value / total) * 100 : 0;
            const currentOffset = offset;
            offset += dash;

            if (dash <= 0) return null;

            return (
              <circle
                key={item.label}
                cx="60"
                cy="60"
                r="44"
                fill="none"
                stroke={colors[item.label] || "#94A3B8"}
                strokeWidth="16"
                strokeDasharray={`${dash} ${100 - dash}`}
                strokeDashoffset={-currentOffset}
                strokeLinecap="butt"
                pathLength="100"
              />
            );
          })}
        </g>
        <text x="60" y="57" textAnchor="middle" className="fill-clutch-text text-xl font-bold">
          {formatNumber(total)}
        </text>
        <text x="60" y="73" textAnchor="middle" className="fill-clutch-muted text-[10px] font-semibold">
          total
        </text>
      </svg>
      <div className="mt-3 flex flex-wrap justify-center gap-3">
        {rows.map((item) => (
          <span key={item.label} className="inline-flex items-center gap-2 text-sm text-clutch-muted">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colors[item.label] || "#94A3B8" }} />
            {item.label}: {formatNumber(item.value)}
          </span>
        ))}
      </div>
    </div>
  );
};

export default LobbyHealthChart;
