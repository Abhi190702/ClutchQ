import { formatMinutes, formatShortDate } from "./profileDisplay";
import ProfileEmptyState from "./ProfileEmptyState";

const intensityClasses = [
  "bg-clutch-panelSoft",
  "bg-sky-950",
  "bg-sky-800",
  "bg-sky-600",
  "bg-clutch-blue"
];

const buildStreaks = (days) => {
  let best = 0;
  let current = 0;
  let run = 0;

  days.forEach((day) => {
    if (day.totalMinutes > 0) {
      run += 1;
      best = Math.max(best, run);
    } else {
      run = 0;
    }
  });

  for (let index = days.length - 1; index >= 0; index -= 1) {
    if (days[index].totalMinutes > 0) current += 1;
    else break;
  }

  return { best, current };
};

const SteamActivityHeatmap = ({ days = [] }) => {
  if (!days.length) {
    return (
      <section id="heatmap" className="card p-5 md:p-6">
        <ProfileEmptyState
          title="Steam activity is private or unavailable."
          description="Start ClutchQ sessions or sync a public Steam profile to build your gaming heatmap."
        />
      </section>
    );
  }

  const sorted = [...days].sort((a, b) => new Date(a.date) - new Date(b.date));
  const totalMinutes = sorted.reduce((sum, day) => sum + (day.totalMinutes || 0), 0);
  const mostActive = sorted.reduce((best, day) => ((day.totalMinutes || 0) > (best?.totalMinutes || 0) ? day : best), sorted[0]);
  const streaks = buildStreaks(sorted);

  return (
    <section id="heatmap" className="card p-5 md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="eyebrow">Activity heatmap</div>
          <h2 className="mt-2 text-2xl font-bold text-clutch-text">Gaming consistency</h2>
          <p className="mt-2 text-sm text-clutch-muted">Daily playtime from Steam and ClutchQ sessions.</p>
        </div>
        <div className="text-sm font-semibold text-clutch-muted">{formatMinutes(totalMinutes)} tracked</div>
      </div>
      <div className="mt-5 overflow-x-auto rounded-md border border-clutch-border bg-clutch-bg/40 p-4">
        <div className="grid auto-cols-[12px] grid-flow-col grid-rows-7 gap-1">
          {sorted.map((day) => {
            const games = day.games?.slice(0, 3).map((game) => `${game.gameName} ${formatMinutes(game.minutes)}`).join("\n");
            const title = `${formatShortDate(day.date)}\n${formatMinutes(day.totalMinutes)} played${games ? `\n${games}` : ""}`;
            return (
              <div
                key={day.date}
                title={title}
                className={`h-3 w-3 rounded-[3px] ${intensityClasses[Math.max(0, Math.min(4, day.intensity || 0))]}`}
              />
            );
          })}
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-md border border-clutch-border bg-clutch-bg/40 p-3">
          <div className="text-xs text-clutch-muted">Total activity</div>
          <div className="mt-1 text-lg font-bold text-clutch-text">{formatMinutes(totalMinutes)}</div>
        </div>
        <div className="rounded-md border border-clutch-border bg-clutch-bg/40 p-3">
          <div className="text-xs text-clutch-muted">Current streak</div>
          <div className="mt-1 text-lg font-bold text-clutch-text">{streaks.current} days</div>
        </div>
        <div className="rounded-md border border-clutch-border bg-clutch-bg/40 p-3">
          <div className="text-xs text-clutch-muted">Best streak</div>
          <div className="mt-1 text-lg font-bold text-clutch-text">{streaks.best} days</div>
        </div>
        <div className="rounded-md border border-clutch-border bg-clutch-bg/40 p-3">
          <div className="text-xs text-clutch-muted">Most active day</div>
          <div className="mt-1 text-lg font-bold text-clutch-text">{formatShortDate(mostActive?.date)}</div>
        </div>
      </div>
    </section>
  );
};

export default SteamActivityHeatmap;
