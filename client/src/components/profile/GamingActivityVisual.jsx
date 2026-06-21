import { formatHours } from "./profileDisplay";

const palette = ["#35B8FF", "#34D399", "#FBBF24", "#A78BFA", "#71717A"];

const buildLinePath = (days) => {
  const width = 520;
  const height = 160;
  const max = Math.max(...days.map((day) => day.totalMinutes || 0), 60);
  const points = days.map((day, index) => {
    const x = days.length === 1 ? 0 : (index / (days.length - 1)) * width;
    const y = height - ((day.totalMinutes || 0) / max) * (height - 18) - 8;
    return [x, y];
  });

  if (!points.length) return "";
  return points.map(([x, y], index) => `${index ? "L" : "M"} ${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
};

const HeatmapCell = ({ day }) => {
  const color = ["bg-white/[0.04]", "bg-sky-900/70", "bg-sky-700/80", "bg-sky-500/80", "bg-clutch-blue"][day.intensity || 0];

  return (
    <div
      className={`h-2.5 w-2.5 rounded-[2px] ${color}`}
      title={`${day.date}: ${formatHours(day.totalMinutes || 0)}`}
    />
  );
};

const GamingActivityVisual = ({ heatmap = [], library = [], recentActivitySummary, compact = false }) => {
  const rhythmDays = (heatmap.length ? heatmap : []).slice(-30);
  const hasRhythm = rhythmDays.some((day) => day.totalMinutes);
  const path = hasRhythm
    ? buildLinePath(rhythmDays)
    : "M 0 112 L 60 98 L 120 105 L 180 76 L 240 88 L 300 62 L 360 72 L 420 48 L 520 58";
  const totalMinutes = heatmap.reduce((sum, day) => sum + (day.totalMinutes || 0), 0) || recentActivitySummary?.totalRecentMinutes || 0;
  const activeDays = heatmap.filter((day) => day.totalMinutes > 0).length;
  const bestDay = heatmap.reduce((best, day) => ((day.totalMinutes || 0) > (best?.totalMinutes || 0) ? day : best), null);
  const split = [...library]
    .filter((game) => game.playtimeForeverMinutes)
    .sort((a, b) => (b.playtimeForeverMinutes || 0) - (a.playtimeForeverMinutes || 0))
    .slice(0, 4);
  const splitTotal = split.reduce((sum, game) => sum + (game.playtimeForeverMinutes || 0), 0);
  let offset = 25;

  return (
    <section className="border-b border-white/10 py-8 md:py-10">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="eyebrow">Activity</div>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-clutch-text md:text-4xl">Gaming rhythm</h2>
        </div>
        <div className="text-base text-clutch-muted">
          <span className="font-black text-clutch-text">{formatHours(totalMinutes)}</span> tracked - {activeDays} active days
        </div>
      </div>

      <div className={`mt-8 grid gap-8 ${compact ? "lg:grid-cols-[1fr_260px]" : "lg:grid-cols-[minmax(0,1fr)_320px]"}`}>
        <div className="min-w-0">
          <div className="overflow-hidden">
            <svg viewBox="0 0 520 180" className="h-48 w-full" preserveAspectRatio="none" aria-label="Gaming rhythm chart">
              <path d={`${path} L 520 180 L 0 180 Z`} fill="rgba(53,184,255,0.08)" />
              <path d={path} fill="none" stroke={hasRhythm ? "#35B8FF" : "#52525B"} strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
            </svg>
            {!hasRhythm && <p className="mt-2 text-sm text-clutch-muted">No tracked rhythm yet. Sync Steam or finish ClutchQ sessions to build this chart.</p>}
          </div>

          <div className="mt-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-clutch-muted">Last 6 months</h3>
              {bestDay?.totalMinutes ? <span className="text-xs text-clutch-muted">Best day {formatHours(bestDay.totalMinutes)}</span> : null}
            </div>
            <div className="grid grid-flow-col grid-rows-7 justify-start gap-1 overflow-x-auto pb-1">
              {(heatmap.length ? heatmap.slice(-182) : Array.from({ length: 98 }, (_, index) => ({ date: `day-${index}`, intensity: 0, totalMinutes: 0 }))).map((day) => (
                <HeatmapCell key={day.date} day={day} />
              ))}
            </div>
          </div>
        </div>

        <div className="border-l border-white/10 pl-0 lg:pl-8">
          <div className="text-sm font-black uppercase tracking-[0.16em] text-clutch-muted">Game time split</div>
          <div className="mt-5 flex items-center justify-center">
            <svg viewBox="0 0 42 42" className="h-36 w-36 -rotate-90">
              <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#2a2a30" strokeWidth="5" />
              {splitTotal ? split.map((game, index) => {
                const pct = ((game.playtimeForeverMinutes || 0) / splitTotal) * 100;
                const dash = `${pct} ${100 - pct}`;
                const segment = (
                  <circle
                    key={game.appId || game.name}
                    cx="21"
                    cy="21"
                    r="15.915"
                    fill="transparent"
                    stroke={palette[index]}
                    strokeDasharray={dash}
                    strokeDashoffset={offset}
                    strokeWidth="5"
                  />
                );
                offset -= pct;
                return segment;
              }) : null}
            </svg>
          </div>
          <div className="mt-4 space-y-3">
            {splitTotal ? split.map((game, index) => (
              <div key={game.appId || game.name} className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 truncate text-clutch-muted">
                  <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: palette[index] }} />
                  {game.name}
                </span>
                <span className="font-bold text-clutch-text">{Math.round(((game.playtimeForeverMinutes || 0) / splitTotal) * 100)}%</span>
              </div>
            )) : (
              <p className="text-sm leading-6 text-clutch-muted">No public game split yet. Sync Steam after setting Game Details to Public.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default GamingActivityVisual;
