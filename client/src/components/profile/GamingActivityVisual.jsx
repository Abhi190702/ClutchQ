import { useMemo } from "react";
import { formatHours, safeNumber } from "../../utils/formatters";
import ActivityCalendarStrip from "../activity/ActivityCalendarStrip";
import { Link } from "react-router-dom";

const normalizeGameSplit = (items = [], source = "steam") =>
  items
    .map((item) => ({
      id: item.appId || item.gameSlug || item.name || item.gameName,
      name: item.gameName || item.name || "Game",
      minutes: safeNumber(item.minutes ?? item.playtimeForeverMinutes ?? item.totalMinutes),
      source
    }))
    .filter((item) => item.minutes > 0);

const GamingActivityVisual = ({ heatmap = [], library = [], recentActivitySummary, rhythm, graph, compact = false }) => {
  const rhythmDays = rhythm?.series?.length ? rhythm.series : heatmap;
  const totalMinutes = useMemo(
    () => safeNumber(rhythm?.summary?.totalMinutes, NaN) || rhythmDays.reduce((sum, day) => sum + safeNumber(day.minutes ?? day.totalMinutes), 0) || recentActivitySummary?.totalRecentMinutes || 0,
    [recentActivitySummary?.totalRecentMinutes, rhythm?.summary?.totalMinutes, rhythmDays]
  );
  const activeDays = useMemo(
    () => safeNumber(rhythm?.summary?.activeDays, NaN) || rhythmDays.filter((day) => safeNumber(day.minutes ?? day.totalMinutes) > 0).length,
    [rhythm?.summary?.activeDays, rhythmDays]
  );
  const split = useMemo(() => {
    const source = rhythm?.gameMix?.length
      ? normalizeGameSplit(rhythm.gameMix, "rhythm")
      : graph?.gameProfiles?.length
        ? normalizeGameSplit(graph.gameProfiles, "graph")
        : normalizeGameSplit(library, "steam");
    return source.sort((a, b) => b.minutes - a.minutes).slice(0, 3);
  }, [graph?.gameProfiles, library, rhythm?.gameMix]);
  const splitTotal = useMemo(() => split.reduce((sum, game) => sum + safeNumber(game.minutes), 0), [split]);
  const latestSession = recentActivitySummary?.sessions?.[0];
  const sourceLabel = rhythm?.source === "python" ? "Python rhythm" : graph?.source === "python" ? "Gameplay Graph" : "Steam and sessions";

  return (
    <section className="border-b border-white/10 py-6 md:py-8">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="eyebrow">Activity</div>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-clutch-text">Profile activity</h2>
          <p className="mt-2 text-sm leading-6 text-clutch-muted">{sourceLabel} powers this read, with Steam/manual sessions as fallback.</p>
        </div>
        <Link to="/activity" className="btn-secondary">Open Activity page</Link>
      </div>

      <div className={`mt-6 grid gap-7 ${compact ? "lg:grid-cols-[1fr_260px]" : "lg:grid-cols-[minmax(0,1fr)_320px]"}`}>
        <div className="min-w-0">
          <ActivityCalendarStrip days={rhythmDays} compact />
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
              <div key={game.id || game.name} className="text-sm">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="min-w-0 truncate font-semibold text-clutch-text">{index + 1}. {game.name}</span>
                  <span className="font-bold text-clutch-muted">{Math.round((game.minutes / splitTotal) * 100)}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                  <div className="h-full rounded-full bg-[#39D353]" style={{ width: `${Math.round((game.minutes / splitTotal) * 100)}%` }} />
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
