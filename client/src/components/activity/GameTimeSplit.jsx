import EmptyState from "../common/EmptyState";
import { formatHours, safeNumber } from "../../utils/formatters";

const colors = ["#35B8FF", "#A78BFA", "#34D399", "#FBBF24", "#71717A"];

const polarToCartesian = (cx, cy, radius, angle) => {
  const radians = ((angle - 90) * Math.PI) / 180;
  return { x: cx + radius * Math.cos(radians), y: cy + radius * Math.sin(radians) };
};

const arcPath = (cx, cy, radius, startAngle, endAngle) => {
  const start = polarToCartesian(cx, cy, radius, endAngle);
  const end = polarToCartesian(cx, cy, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
};

const GameTimeSplit = ({ items = [] }) => {
  const total = items.reduce((sum, item) => sum + safeNumber(item.minutes), 0);
  let cursor = 0;

  if (!total) {
    return (
      <section className="rounded-3xl bg-white/[0.035] p-6">
        <div className="eyebrow mb-3">Game split</div>
        <h2 className="text-2xl font-black text-white">Time by game</h2>
        <EmptyState compact className="mt-5 border-white/10 bg-transparent" title="No play split yet." description="Your top games will appear after sessions or Steam sync." />
      </section>
    );
  }

  const arcs = items.map((item, index) => {
    const percent = safeNumber(item.minutes) / total;
    const start = cursor;
    const end = cursor + percent * 360;
    cursor = end;
    return { ...item, percent, start, end, color: colors[index % colors.length] };
  });

  return (
    <section className="rounded-3xl bg-white/[0.035] p-6">
      <div className="eyebrow mb-3">Game split</div>
      <h2 className="text-2xl font-black text-white">Time by game</h2>
      <div className="mt-6 grid gap-6 md:grid-cols-[180px_1fr]">
        <svg viewBox="0 0 180 180" className="h-44 w-44" role="img" aria-label="Game time split">
          <circle cx="90" cy="90" r="64" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="18" />
          {arcs.map((arc) => (
            <path
              key={arc.gameName}
              d={arcPath(90, 90, 64, arc.start, arc.end)}
              fill="none"
              stroke={arc.color}
              strokeLinecap="round"
              strokeWidth="18"
            />
          ))}
          <text x="90" y="84" textAnchor="middle" className="fill-white text-[20px] font-black">
            {formatHours(total)}
          </text>
          <text x="90" y="106" textAnchor="middle" className="fill-zinc-500 text-[11px] font-bold">
            tracked
          </text>
        </svg>
        <div className="divide-y divide-white/10">
          {arcs.map((item) => (
            <div key={item.gameName} className="flex items-center justify-between gap-4 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="truncate text-sm font-bold text-white">{item.gameName}</span>
              </div>
              <div className="text-right text-sm text-zinc-400">
                <span className="font-black text-white">{Math.round(item.percent * 100)}%</span> · {formatHours(item.minutes)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default GameTimeSplit;
