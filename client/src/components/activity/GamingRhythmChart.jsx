import { useEffect, useRef, useState } from "react";
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

const getAxisLabelIndexes = (length, compact = false) => {
  if (length <= 1) return [0];
  if (compact) return [0, Math.floor((length - 1) / 2), length - 1];

  const indexes = [];
  for (let index = 0; index < length; index += 7) {
    indexes.push(index);
  }

  const lastIndex = length - 1;
  const previousIndex = indexes[indexes.length - 1];
  if (lastIndex - previousIndex < 4) {
    indexes[indexes.length - 1] = lastIndex;
  } else {
    indexes.push(lastIndex);
  }

  return [...new Set(indexes)];
};

const getNiceAxis = (maximum) => {
  const rawStep = Math.max(1, maximum) / 4;
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const normalized = rawStep / magnitude;
  const niceMultiplier = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 2.5 ? 2.5 : normalized <= 5 ? 5 : 10;
  const step = Math.max(5, niceMultiplier * magnitude);
  const axisMaximum = Math.max(step, Math.ceil(maximum / step) * step);

  return {
    maximum: axisMaximum,
    ticks: Array.from({ length: Math.round(axisMaximum / step) + 1 }, (_, index) => index * step)
  };
};

const formatAxisTime = (minutes) => {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);
  return remainingMinutes ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
};

const buildSmoothPath = (points) => {
  if (!points.length) return "";
  if (points.length === 1) return `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;

  const segments = [`M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`];
  for (let index = 0; index < points.length - 1; index += 1) {
    const previous = points[index - 1] || points[index];
    const current = points[index];
    const next = points[index + 1];
    const following = points[index + 2] || next;
    const minimumY = Math.min(current.y, next.y);
    const maximumY = Math.max(current.y, next.y);
    const controlOneY = Math.min(maximumY, Math.max(minimumY, current.y + (next.y - previous.y) / 6));
    const controlTwoY = Math.min(maximumY, Math.max(minimumY, next.y - (following.y - current.y) / 6));
    const controlOneX = current.x + (next.x - previous.x) / 6;
    const controlTwoX = next.x - (following.x - current.x) / 6;

    segments.push(
      `C ${controlOneX.toFixed(1)} ${controlOneY.toFixed(1)}, ${controlTwoX.toFixed(1)} ${controlTwoY.toFixed(1)}, ${next.x.toFixed(1)} ${next.y.toFixed(1)}`
    );
  }

  return segments.join(" ");
};

const GamingRhythmChart = ({ series = [] }) => {
  const days = normalizeSeries(series);
  const maxMinutes = Math.max(...days.map((item) => safeNumber(item.minutes)), 0);
  const activeDays = days.filter((item) => item.minutes > 0).length;
  const totalMinutes = days.reduce((sum, item) => sum + safeNumber(item.minutes), 0);
  const peak = days.reduce((best, item) => (item.minutes > best.minutes ? item : best), days[0]);
  const hasActivity = activeDays > 0;
  const chartFrameRef = useRef(null);
  const [chartWidth, setChartWidth] = useState(760);

  useEffect(() => {
    const element = chartFrameRef.current;
    if (!hasActivity || !element) return undefined;
    const updateWidth = () => setChartWidth(Math.max(240, Math.round(element.clientWidth)));
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(element);
    return () => observer.disconnect();
  }, [hasActivity]);

  const compactChart = chartWidth < 520;
  const chartHeight = compactChart ? 236 : 280;
  const padding = compactChart
    ? { top: 20, right: 12, bottom: 44, left: 70 }
    : { top: 24, right: 22, bottom: 52, left: 82 };
  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;
  const axis = getNiceAxis(maxMinutes);
  const points = days.map((day, index) => {
    const x = padding.left + (index / Math.max(1, days.length - 1)) * plotWidth;
    const y = padding.top + plotHeight - (safeNumber(day.minutes) / axis.maximum) * plotHeight;
    return { ...day, x, y };
  });
  const linePath = buildSmoothPath(points);
  const areaPath = `${linePath} L ${padding.left + plotWidth} ${padding.top + plotHeight} L ${padding.left} ${padding.top + plotHeight} Z`;
  const axisLabelIndexes = getAxisLabelIndexes(points.length, compactChart);

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
        <div ref={chartFrameRef} className="w-full">
        <svg className="block h-auto w-full" viewBox={`0 0 ${chartWidth} ${chartHeight}`} role="img" aria-label="Gaming rhythm line chart">
          <defs>
            <linearGradient id="rhythm-area" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.24" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
            </linearGradient>
          </defs>
          <text
            x={compactChart ? 8 : 18}
            y={padding.top + plotHeight / 2}
            transform={`rotate(-90 ${compactChart ? 8 : 18} ${padding.top + plotHeight / 2})`}
            textAnchor="middle"
            fill="rgba(161,161,170,0.72)"
            fontSize={compactChart ? "9" : "10"}
            fontWeight="800"
          >
            DAILY PLAYTIME
          </text>
          {axis.ticks.map((tick) => {
            const y = padding.top + plotHeight - (tick / axis.maximum) * plotHeight;
            return (
              <g key={`time-${tick}`}>
                <line
                  x1={padding.left}
                  x2={padding.left + plotWidth}
                  y1={y}
                  y2={y}
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="1"
                />
                <line x1={padding.left - 6} x2={padding.left} y1={y} y2={y} stroke="rgba(186,230,253,0.42)" strokeWidth="1.5" />
                <text x={padding.left - 11} y={y + 4} textAnchor="end" fill="rgba(212,212,216,0.76)" fontSize={compactChart ? "10" : "11"} fontWeight="700">
                  {formatAxisTime(tick)}
                </text>
              </g>
            );
          })}
          <line
            x1={padding.left}
            x2={padding.left}
            y1={padding.top}
            y2={padding.top + plotHeight}
            stroke="rgba(186,230,253,0.22)"
            strokeWidth="1.5"
          />
          {axisLabelIndexes.map((index) => {
            const point = points[index];
            return (
              <line
                key={`date-grid-${point.date}`}
                x1={point.x}
                x2={point.x}
                y1={padding.top}
                y2={padding.top + plotHeight}
                stroke="rgba(255,255,255,0.035)"
                strokeWidth="1"
              />
            );
          })}
          <path d={areaPath} fill="url(#rhythm-area)" />
          <path d={linePath} fill="none" stroke="rgba(56,189,248,0.18)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="9" />
          <path d={linePath} fill="none" stroke="#38bdf8" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.5" />
          {points.map((point, index) => {
            const isPeak = point.date === peak.date;
            return (
              <g key={point.date}>
                <circle cx={point.x} cy={point.y} r={isPeak ? 5.5 : 3.5} fill={isPeak ? "#e0f2fe" : "#101217"} stroke="#bae6fd" strokeWidth="2" />
                <title>{`${formatShortDate(point.date)}: ${formatMinutes(point.minutes)}${formatGames(point.games)}`}</title>
              </g>
            );
          })}
          {axisLabelIndexes.map((index) => {
            const point = points[index];
            const isFirst = index === 0;
            const isLast = index === points.length - 1;
            const textAnchor = isFirst ? "start" : isLast ? "end" : "middle";
            return (
              <g key={`axis-${point.date}`}>
                <line
                  x1={point.x}
                  x2={point.x}
                  y1={padding.top + plotHeight + 5}
                  y2={padding.top + plotHeight + 12}
                  stroke="rgba(212,212,216,0.34)"
                  strokeWidth="1.5"
                />
                <text x={point.x} y={chartHeight - 13} textAnchor={textAnchor} fill="rgba(228,228,231,0.78)" fontSize={compactChart ? "10" : "12"} fontWeight="800">
                  {formatShortDate(point.date).replace(" ", "\u00a0")}
                </text>
              </g>
            );
          })}
        </svg>
        </div>
      </div>

      <div className="mt-3 text-xs font-bold text-zinc-500">
        Daily minutes from tracked sessions and Steam activity. Hover points for date, minutes, and games.
      </div>
    </section>
  );
};

export default GamingRhythmChart;
