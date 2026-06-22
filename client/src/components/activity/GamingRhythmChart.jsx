import EmptyState from "../common/EmptyState";
import { formatHours, safeNumber } from "../../utils/formatters";

const GamingRhythmChart = ({ series = [] }) => {
  const width = 760;
  const height = 230;
  const padding = 28;
  const maxMinutes = Math.max(...series.map((item) => safeNumber(item.minutes)), 0);

  if (!series.some((item) => safeNumber(item.minutes) > 0)) {
    return (
      <section className="border-b border-white/10 pb-6">
        <div className="eyebrow mb-3">Rhythm</div>
        <h2 className="text-2xl font-black text-white">Playtime trend</h2>
        <EmptyState
          compact
          className="mt-5 border-white/10 bg-transparent"
          title="No rhythm yet."
          description="Start a session or sync Steam to build your activity graph."
        />
      </section>
    );
  }

  const points = series.map((item, index) => {
    const x = padding + (index / Math.max(1, series.length - 1)) * (width - padding * 2);
    const y = height - padding - (safeNumber(item.minutes) / maxMinutes) * (height - padding * 2);
    return { ...item, x, y };
  });
  const line = points.map((point, index) => `${index ? "L" : "M"} ${point.x} ${point.y}`).join(" ");
  const area = `${line} L ${width - padding} ${height - padding} L ${padding} ${height - padding} Z`;

  return (
    <section className="border-b border-white/10 pb-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="eyebrow mb-3">Rhythm</div>
          <h2 className="text-2xl font-black text-white">Playtime trend</h2>
        </div>
        <div className="text-sm font-semibold text-zinc-400">Peak day {formatHours(maxMinutes)}</div>
      </div>

      <svg className="mt-5 h-auto w-full overflow-visible" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Playtime trend chart">
        <defs>
          <linearGradient id="rhythm-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#35B8FF" stopOpacity="0.24" />
            <stop offset="100%" stopColor="#35B8FF" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75, 1].map((ratio) => (
          <line
            key={ratio}
            x1={padding}
            x2={width - padding}
            y1={padding + ratio * (height - padding * 2)}
            y2={padding + ratio * (height - padding * 2)}
            stroke="rgba(255,255,255,0.08)"
          />
        ))}
        <path d={area} fill="url(#rhythm-fill)" />
        <path d={line} fill="none" stroke="#35B8FF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
        {points.map((point, index) =>
          index % 3 === 0 || point.minutes ? (
            <circle key={`${point.date}-${index}`} cx={point.x} cy={point.y} r="4" fill="#F5F5F7">
              <title>{`${point.label}: ${formatHours(point.minutes)}`}</title>
            </circle>
          ) : null
        )}
      </svg>
    </section>
  );
};

export default GamingRhythmChart;
