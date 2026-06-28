import { useMemo } from "react";
import { formatMinutes, formatShortDate, safeNumber } from "../../utils/formatters";

const addDays = (date, amount) => {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
};

const toDateKey = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

const normalizeDays = (days = [], length) => {
  const source = days
    .map((day) => ({
      ...day,
      date: toDateKey(day.date),
      minutes: safeNumber(day.minutes ?? day.totalMinutes)
    }))
    .filter((day) => day.date);
  const byDate = new Map(source.map((day) => [day.date, day]));
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

const dayNumber = (dateKey) => {
  const date = new Date(dateKey);
  return Number.isNaN(date.getTime()) ? "" : String(date.getDate());
};

const monthName = (dateKey) => {
  const date = new Date(dateKey);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("en", { month: "short" });
};

const shouldShowMonth = (days, index) => {
  if (index === 0) return true;
  const current = new Date(days[index].date);
  const previous = new Date(days[index - 1].date);
  return current.getMonth() !== previous.getMonth();
};

const gameSummary = (games = []) =>
  games.length ? ` · ${games.slice(0, 2).map((game) => game.gameName || game.name).filter(Boolean).join(", ")}` : "";

const buildSmoothPath = (points) => {
  if (!points.length) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  return points.reduce((path, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`;
    const previous = points[index - 1];
    const controlX = previous.x + (point.x - previous.x) / 2;
    return `${path} C ${controlX} ${previous.y}, ${controlX} ${point.y}, ${point.x} ${point.y}`;
  }, "");
};

const ActivityCalendarStrip = ({ days = [], compact = false }) => {
  const visibleDays = useMemo(() => normalizeDays(days, compact ? 21 : 31), [compact, days]);
  const totalMinutes = useMemo(() => visibleDays.reduce((sum, day) => sum + safeNumber(day.minutes), 0), [visibleDays]);
  const activeDays = useMemo(() => visibleDays.filter((day) => safeNumber(day.minutes) > 0).length, [visibleDays]);
  const maxMinutes = useMemo(() => Math.max(...visibleDays.map((day) => safeNumber(day.minutes)), 0), [visibleDays]);
  const peak = useMemo(() => visibleDays.reduce((best, day) => (day.minutes > best.minutes ? day : best), visibleDays[0]), [visibleDays]);

  const width = 920;
  const height = 330;
  const left = 58;
  const right = 28;
  const top = 48;
  const bottom = 64;
  const graphHeight = height - top - bottom;
  const graphWidth = width - left - right;
  const yMax = Math.max(60, Math.ceil(maxMinutes / 60) * 60);
  const yTicks = [1, 0.75, 0.5, 0.25, 0].map((ratio) => Math.round(yMax * ratio));
  const points = visibleDays.map((day, index) => {
    const x = left + (index / Math.max(1, visibleDays.length - 1)) * graphWidth;
    const y = top + graphHeight - (safeNumber(day.minutes) / yMax) * graphHeight;
    return { ...day, x, y };
  });
  const path = buildSmoothPath(points);

  return (
    <section className={`${compact ? "" : "border-b border-white/10 pb-6"}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="eyebrow mb-2">Rhythm evidence</div>
          <h2 className={`${compact ? "text-xl" : "text-2xl"} font-black text-white`}>Daily gameplay graph</h2>
          <p className="mt-2 text-sm text-zinc-500">
            {formatShortDate(visibleDays[0].date)} - {formatShortDate(visibleDays[visibleDays.length - 1].date)}
          </p>
        </div>
        <div className="text-sm font-semibold text-zinc-400">
          {activeDays} active days · {formatMinutes(totalMinutes)} tracked · peak {formatMinutes(peak.minutes)}
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-[22px] border border-white/10 bg-[#101418] px-3 py-5 shadow-[0_20px_70px_rgba(0,0,0,0.24)]">
        <svg className="h-auto w-full" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Daily gameplay rhythm line graph">
          <defs>
            <filter id="green-line-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="2.2" floodColor="#2ea043" floodOpacity="0.28" />
            </filter>
          </defs>

          <text x={width / 2} y="16" textAnchor="middle" className="fill-zinc-400 text-sm font-bold">
            ClutchQ Gameplay Rhythm
          </text>

          {yTicks.map((tick) => {
            const y = top + graphHeight - (tick / yMax) * graphHeight;
            return (
              <g key={tick}>
                <line x1={left} x2={width - right} y1={y} y2={y} stroke="rgba(148,163,184,0.22)" strokeDasharray="2 3" />
                <text x={left - 12} y={y + 4} textAnchor="end" className="fill-slate-300 text-[11px]">
                  {Math.round(tick / 60)}h
                </text>
              </g>
            );
          })}

          {points.map((point, index) => (
            <g key={`grid-${point.date}`}>
              <line x1={point.x} x2={point.x} y1={top} y2={top + graphHeight} stroke="rgba(148,163,184,0.16)" strokeDasharray="2 3" />
              {shouldShowMonth(visibleDays, index) ? (
                <text x={point.x} y={height - 6} textAnchor="middle" className="fill-slate-300 text-[11px] font-bold">
                  {monthName(point.date)}
                </text>
              ) : null}
            </g>
          ))}

          <path d={path} fill="none" stroke="#2ea043" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" filter="url(#green-line-shadow)" />

          {points.map((point) => (
            <g key={point.date}>
              <circle cx={point.x} cy={point.y} r="4.3" fill="#9aa7b2" stroke="#101418" strokeWidth="1.5">
                <title>{`${formatShortDate(point.date)}: ${formatMinutes(point.minutes)}${gameSummary(point.games)}`}</title>
              </circle>
              <text x={point.x} y={height - 30} textAnchor="middle" className="fill-slate-300 text-[10px]">
                {dayNumber(point.date)}
              </text>
            </g>
          ))}

          <text x="16" y={top + graphHeight / 2} transform={`rotate(-90 16 ${top + graphHeight / 2})`} textAnchor="middle" className="fill-slate-300 text-[11px]">
            Gameplay time
          </text>
          <text x={left + graphWidth / 2} y={height - 18} textAnchor="middle" className="fill-slate-300 text-[11px]">
            Calendar days
          </text>
        </svg>
      </div>
    </section>
  );
};

export default ActivityCalendarStrip;
