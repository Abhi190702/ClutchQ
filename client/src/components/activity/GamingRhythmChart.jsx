import EmptyState from "../common/EmptyState";
import { formatMinutes, formatShortDate, safeNumber } from "../../utils/formatters";

const blockColors = [
  { top: "#121816", left: "#0c1110", right: "#0f1513" },
  { top: "#16351f", left: "#0e2515", right: "#12301b" },
  { top: "#1f6f38", left: "#145125", right: "#1a6330" },
  { top: "#2ea043", left: "#1f7a34", right: "#278b3d" },
  { top: "#56d364", left: "#2ea043", right: "#3fb950" }
];

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

const normalizeSeries = (series = []) => {
  const source = series
    .map((item) => ({
      ...item,
      date: toDateKey(item.date),
      minutes: safeNumber(item.minutes ?? item.totalMinutes)
    }))
    .filter((item) => item.date);
  const byDate = new Map(source.map((item) => [item.date, item]));
  const endDate = source.length ? new Date(source[source.length - 1].date) : new Date();
  const startDate = addDays(endDate, -55);

  return Array.from({ length: 56 }, (_, index) => {
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

const getLevel = (minutes, maxMinutes) => {
  if (!minutes) return 0;
  if (maxMinutes <= 0) return 0;
  const ratio = minutes / maxMinutes;
  if (ratio >= 0.78) return 4;
  if (ratio >= 0.48) return 3;
  if (ratio >= 0.22) return 2;
  return 1;
};

const formatGames = (games = []) =>
  games.length ? ` · ${games.slice(0, 2).map((game) => game.gameName || game.name).filter(Boolean).join(", ")}` : "";

const blockPath = ({ x, y, lift, level }) => {
  const color = blockColors[level];
  const topY = y - lift;
  const points = {
    top: `${x},${topY} ${x + 15},${topY - 7} ${x + 30},${topY} ${x + 15},${topY + 8}`,
    left: `${x},${topY} ${x + 15},${topY + 8} ${x + 15},${y + 18} ${x},${y + 10}`,
    right: `${x + 15},${topY + 8} ${x + 30},${topY} ${x + 30},${y + 10} ${x + 15},${y + 18}`
  };

  return (
    <g>
      <polygon points={points.left} fill={color.left} stroke="rgba(0,0,0,0.34)" strokeWidth="0.8" />
      <polygon points={points.right} fill={color.right} stroke="rgba(0,0,0,0.34)" strokeWidth="0.8" />
      <polygon points={points.top} fill={color.top} stroke="rgba(255,255,255,0.08)" strokeWidth="0.8" />
    </g>
  );
};

const GamingRhythmChart = ({ series = [] }) => {
  const days = normalizeSeries(series);
  const maxMinutes = Math.max(...days.map((item) => safeNumber(item.minutes)), 0);
  const activeDays = days.filter((item) => item.minutes > 0).length;
  const totalMinutes = days.reduce((sum, item) => sum + safeNumber(item.minutes), 0);
  const peak = days.reduce((best, item) => (item.minutes > best.minutes ? item : best), days[0]);
  const hasActivity = activeDays > 0;

  if (!hasActivity) {
    return (
      <section className="border-b border-white/10 pb-6">
        <div className="eyebrow mb-3">Rhythm</div>
        <h2 className="text-2xl font-black text-white">Gameplay contribution field</h2>
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
          <h2 className="text-2xl font-black text-white">Gameplay contribution field</h2>
          <p className="mt-2 text-sm text-zinc-500">
            {formatShortDate(days[0].date)} - {formatShortDate(days[days.length - 1].date)} · {activeDays} active days · {formatMinutes(totalMinutes)} tracked
          </p>
        </div>
        <div className="text-sm font-semibold text-emerald-300">
          Peak {formatShortDate(peak.date)} · {formatMinutes(peak.minutes)}
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-[22px] border border-white/10 bg-[#111512] px-4 py-5 shadow-[0_20px_70px_rgba(0,0,0,0.24)]">
        <svg className="h-auto w-full" viewBox="0 0 780 278" role="img" aria-label="3D gameplay contribution blocks">
          <defs>
            <linearGradient id="activity-board-grid" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#132017" />
              <stop offset="100%" stopColor="#0b0d0c" />
            </linearGradient>
          </defs>
          <polygon points="104,58 360,174 662,48 408,0" fill="url(#activity-board-grid)" opacity="0.7" />
          {days.map((day, index) => {
            const week = Math.floor(index / 7);
            const row = index % 7;
            const level = getLevel(day.minutes, maxMinutes);
            const lift = level * 6;
            const x = 118 + week * 67 - row * 30;
            const y = 74 + week * 31 + row * 15;

            return (
              <g key={day.date}>
                {blockPath({ x, y, lift, level })}
                <title>{`${formatShortDate(day.date)}: ${formatMinutes(day.minutes)}${formatGames(day.games)}`}</title>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs font-bold text-zinc-500">
        <span>Each block is one day. Taller green blocks mean more tracked gameplay.</span>
        <span className="flex items-center gap-2">
          Less
          {[0, 1, 2, 3, 4].map((level) => (
            <span key={level} className="h-3 w-3 rounded-[3px] border border-white/10" style={{ backgroundColor: blockColors[level].top }} />
          ))}
          More
        </span>
      </div>
    </section>
  );
};

export default GamingRhythmChart;
