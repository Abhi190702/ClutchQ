import { useMemo } from "react";
import { formatMinutes, safeNumber } from "../../utils/formatters";
import { gameInitials, getGameArt } from "../../utils/gameArt";
import GamingRhythmChart from "../activity/GamingRhythmChart";
import { Link } from "react-router-dom";

const canonicalGameName = (value = "") => {
  const name = String(value || "Game").trim();
  const key = name.toLowerCase().replace(/[-_]+/g, " ").replace(/\s+/g, " ");
  return ["cs2", "counter strike 2"].includes(key) ? "CS2" : name;
};

const normalizeGameSplit = (items = [], source = "steam") =>
  items
    .map((item) => ({
      id: item.appId || item.gameSlug || item.name || item.gameName,
      name: canonicalGameName(item.gameName || item.name),
      minutes: safeNumber(item.minutes ?? item.playtimeForeverMinutes ?? item.totalMinutes),
      source
    }))
    .filter((item) => item.minutes > 0);

const mergeGameSplit = (items = []) => {
  const merged = new Map();
  items.forEach((item) => {
    const key = item.name.toLowerCase();
    const existing = merged.get(key);
    merged.set(key, existing ? { ...existing, minutes: existing.minutes + item.minutes } : item);
  });
  return [...merged.values()];
};

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
    return mergeGameSplit(source).sort((a, b) => b.minutes - a.minutes).slice(0, 3);
  }, [graph?.gameProfiles, library, rhythm?.gameMix]);
  const splitTotal = useMemo(() => split.reduce((sum, game) => sum + safeNumber(game.minutes), 0), [split]);
  const latestSession = recentActivitySummary?.sessions?.[0];
  const latestGame = latestSession?.gameName || "No recent session";
  const latestGameArt = latestSession?.gameName ? getGameArt(latestSession.gameName) : "";
  const peakMinutes = useMemo(() => Math.max(0, ...rhythmDays.map((day) => safeNumber(day.minutes ?? day.totalMinutes))), [rhythmDays]);
  const sourceLabel = rhythm?.source === "python" ? "Python rhythm" : graph?.source === "python" ? "Gameplay Graph" : "Steam and sessions";

  return (
    <section className="border-b border-white/10 py-8 md:py-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="eyebrow">Activity</div>
          <h2 className="mt-2 text-3xl font-black text-clutch-text">Your activity, at a glance</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-clutch-muted">A focused read powered by {sourceLabel}, tracked sessions, and public Steam activity.</p>
        </div>
        <Link to="/activity" className="btn-secondary">Open Activity page</Link>
      </div>

      <div className={`mt-8 grid gap-8 ${compact ? "lg:grid-cols-[1fr_260px]" : "xl:grid-cols-[minmax(0,1fr)_320px]"}`}>
        <div className="min-w-0">
          <GamingRhythmChart series={rhythmDays} embedded />
        </div>

        <aside className="border-t border-white/10 pt-6 xl:border-l xl:border-t-0 xl:pl-8 xl:pt-0">
          <div className="eyebrow">Latest signal</div>
          <div className="mt-4 flex items-center gap-4">
            <span className="relative grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-[16px] bg-[#1a1d24] text-sm font-black text-white ring-1 ring-white/10">
              <span>{gameInitials(latestGame)}</span>
              {latestGameArt ? <img src={latestGameArt} alt="" className="absolute inset-0 h-full w-full object-cover" onError={(event) => { event.currentTarget.style.display = "none"; }} /> : null}
            </span>
            <div className="min-w-0">
              <div className="truncate text-xl font-black text-white">{latestGame}</div>
              <div className="mt-1 text-xs font-semibold text-zinc-500">Latest tracked session</div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-4 border-y border-white/10 py-5">
            <div>
              <div className="text-2xl font-black text-white">{formatMinutes(totalMinutes)}</div>
              <div className="mt-1 text-xs font-semibold text-zinc-500">tracked</div>
            </div>
            <div>
              <div className="text-2xl font-black text-white">{activeDays}</div>
              <div className="mt-1 text-xs font-semibold text-zinc-500">active days</div>
            </div>
            <div>
              <div className="text-2xl font-black text-white">{formatMinutes(peakMinutes)}</div>
              <div className="mt-1 text-xs font-semibold text-zinc-500">peak day</div>
            </div>
          </div>

          <div className="mt-6 text-sm font-bold text-clutch-muted">Current game mix</div>
          <div className="mt-4 space-y-4">
            {splitTotal ? split.map((game, index) => (
              <div key={game.id || game.name} className="flex items-center gap-3 text-sm">
                <span className="relative grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-[11px] bg-[#1a1d24] text-[10px] font-black text-white ring-1 ring-white/10">
                  <span>{gameInitials(game.name)}</span>
                  <img src={getGameArt(game.name)} alt="" className="absolute inset-0 h-full w-full object-cover" onError={(event) => { event.currentTarget.style.display = "none"; }} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="min-w-0 truncate font-semibold text-clutch-text">{index + 1}. {game.name}</span>
                    <span className="font-bold text-clutch-muted">{Math.round((game.minutes / splitTotal) * 100)}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                    <div className="h-full rounded-full bg-[#39D353]" style={{ width: `${Math.round((game.minutes / splitTotal) * 100)}%` }} />
                  </div>
                </div>
              </div>
            )) : (
              <p className="text-sm leading-6 text-clutch-muted">No public game split yet. Sync Steam after setting Game Details to Public.</p>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
};

export default GamingActivityVisual;
