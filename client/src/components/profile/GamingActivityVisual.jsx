import { formatHours } from "../../utils/formatters";
import ActivityCalendarStrip from "../activity/ActivityCalendarStrip";
import { Link } from "react-router-dom";

const GamingActivityVisual = ({ heatmap = [], library = [], recentActivitySummary, compact = false }) => {
  const totalMinutes = heatmap.reduce((sum, day) => sum + (day.totalMinutes || 0), 0) || recentActivitySummary?.totalRecentMinutes || 0;
  const activeDays = heatmap.filter((day) => day.totalMinutes > 0).length;
  const split = [...library]
    .filter((game) => game.playtimeForeverMinutes)
    .sort((a, b) => (b.playtimeForeverMinutes || 0) - (a.playtimeForeverMinutes || 0))
    .slice(0, 3);
  const splitTotal = split.reduce((sum, game) => sum + (game.playtimeForeverMinutes || 0), 0);
  const latestSession = recentActivitySummary?.sessions?.[0];

  return (
    <section className="border-b border-white/10 py-6 md:py-8">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="eyebrow">Activity</div>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-clutch-text">Profile activity</h2>
        </div>
        <Link to="/activity" className="btn-secondary">Open Activity page</Link>
      </div>

      <div className={`mt-6 grid gap-7 ${compact ? "lg:grid-cols-[1fr_260px]" : "lg:grid-cols-[minmax(0,1fr)_320px]"}`}>
        <div className="min-w-0">
          <ActivityCalendarStrip days={heatmap} compact />
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="border-l border-white/10 pl-3">
              <div className="text-xl font-black text-white">{formatHours(totalMinutes)}</div>
              <div className="text-xs font-semibold text-zinc-500">tracked</div>
            </div>
            <div className="border-l border-white/10 pl-3">
              <div className="text-xl font-black text-white">{activeDays}</div>
              <div className="text-xs font-semibold text-zinc-500">active days</div>
            </div>
            <div className="border-l border-white/10 pl-3">
              <div className="text-xl font-black text-white">{latestSession?.gameName || "No session"}</div>
              <div className="text-xs font-semibold text-zinc-500">latest session</div>
            </div>
          </div>
        </div>

        <div className="border-l border-white/10 pl-0 lg:pl-6">
          <div className="text-sm font-bold text-clutch-muted">Top games</div>
          <div className="mt-4 space-y-3">
            {splitTotal ? split.map((game, index) => (
              <div key={game.appId || game.name} className="text-sm">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="min-w-0 truncate font-semibold text-clutch-text">{index + 1}. {game.name}</span>
                  <span className="font-bold text-clutch-muted">{Math.round(((game.playtimeForeverMinutes || 0) / splitTotal) * 100)}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                  <div className="h-full rounded-full bg-clutch-blue" style={{ width: `${Math.round(((game.playtimeForeverMinutes || 0) / splitTotal) * 100)}%` }} />
                </div>
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
