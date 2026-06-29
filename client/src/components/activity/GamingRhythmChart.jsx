import EmptyState from "../common/EmptyState";
import { formatMinutes, formatShortDate, safeNumber } from "../../utils/formatters";

const toDateKey = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

const addDays = (date, amount) => {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
};

const normalizeSeries = (series = [], length = 30) => {
  const source = series
    .map((item) => ({
      ...item,
      date: toDateKey(item.date),
      minutes: safeNumber(item.minutes ?? item.totalMinutes)
    }))
    .filter((item) => item.date);
  const byDate = new Map(source.map((item) => [item.date, item]));
  const endDate = source.length ? new Date(source[source.length - 1].date) : new Date();
  const startDate = addDays(endDate, -(length - 1));

  return Array.from({ length }, (_, index) => {
    const date = addDays(startDate, index);
    const dateKey = date.toISOString().slice(0, 10);
    const existing = byDate.get(dateKey);
    return {
      date: dateKey,
      label: existing?.label || formatShortDate(dateKey),
      minutes: safeNumber(existing?.minutes),
      games: existing?.games || []
    };
  });
};

const formatGames = (games = []) =>
  games.length ? ` · ${games.slice(0, 2).map((game) => game.gameName || game.name).filter(Boolean).join(", ")}` : "";

const GamingRhythmChart = ({ series = [] }) => {
  const days = normalizeSeries(series);
  const maxMinutes = Math.max(...days.map((item) => safeNumber(item.minutes)), 0);
  const activeDays = days.filter((item) => item.minutes > 0).length;
  const totalMinutes = days.reduce((sum, item) => sum + safeNumber(item.minutes), 0);
  const peak = days.reduce((best, item) => (item.minutes > best.minutes ? item : best), days[0]);
  const hasActivity = activeDays > 0;
  const chartWidth = 720;
  const chartHeight = 210;
  const padding = { top: 26, right: 16, bottom: 34, left: 44 };
  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;
  const points = days.map((day, index) => {
    const x = padding.left + (index / Math.max(1, days.length - 1)) * plotWidth;
    const y = padding.top + plotHeight - (maxMinutes ? (safeNumber(day.minutes) / maxMinutes) * plotHeight : 0);
    return { ...day, x, y };
  });
  const linePath = points.map((point, index) => `${index ? "L" : "M"} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L ${padding.left + plotWidth} ${padding.top + plotHeight} L ${padding.left} ${padding.top + plotHeight} Z`;

  if (!hasActivity) {
    return (
      <section className="border-b border-white/10 pb-6">
        <div className="eyebrow mb-3">Rhythm</div>
        <h2 className="text-2xl font-black text-white">Gaming rhythm</h2>
        <EmptyState
          compact
          className="mt-5 border-white/10 bg-transparent"
          title="No rhythm yet."
          description="Start a session or sync Steam to build your activity graph."
        />
      </section>
    );
  }

  return (
    <section className="border-b border-white/10 pb-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="eyebrow mb-3">Rhythm</div>
          <h2 className="text-2xl font-black text-white">Gaming rhythm</h2>
          <p className="mt-2 text-sm text-zinc-500">
            {formatShortDate(days[0].date)} - {formatShortDate(days[days.length - 1].date)} · {activeDays} active days · {formatMinutes(totalMinutes)} tracked
          </p>
        </div>
        <div className="text-sm font-semibold text-sky-200">
          Peak {formatShortDate(peak.date)} · {formatMinutes(peak.minutes)}
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-[18px] border border-white/10 bg-[#111217] px-3 py-4">
        <svg className="h-auto w-full" viewBox={`0 0 ${chartWidth} ${chartHeight}`} role="img" aria-label="Gaming rhythm line chart">
          <defs>
            <linearGradient id="rhythm-area" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.24" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0, 0.33, 0.66, 1].map((ratio) => (
            <line
              key={ratio}
              x1={padding.left}
              x2={padding.left + plotWidth}
              y1={padding.top + ratio * plotHeight}
              y2={padding.top + ratio * plotHeight}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="1"
            />
          ))}
          <path d={areaPath} fill="url(#rhythm-area)" />
          <path d={linePath} fill="none" stroke="#38bdf8" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
          {points.map((point, index) => {
            const isPeak = point.date === peak.date;
            const shouldLabel = index === 0 || index === points.length - 1 || index % 7 === 0;
            return (
              <g key={point.date}>
                <circle cx={point.x} cy={point.y} r={isPeak ? 5.5 : 3.5} fill={isPeak ? "#e0f2fe" : "#101217"} stroke="#bae6fd" strokeWidth="2" />
                <title>{`${formatShortDate(point.date)}: ${formatMinutes(point.minutes)}${formatGames(point.games)}`}</title>
                {shouldLabel ? (
                  <text x={point.x} y={chartHeight - 10} textAnchor="middle" fill="rgba(212,212,216,0.56)" fontSize="11" fontWeight="700">
                    {formatShortDate(point.date).replace(" ", "\u00a0")}
                  </text>
                ) : null}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-3 text-xs font-bold text-zinc-500">
        Daily minutes from tracked sessions and Steam activity. Hover points for date, minutes, and games.
      </div>
    </section>
  );
};

export default GamingRhythmChart;
