import { formatMinutes, formatShortDate } from "../../utils/formatters";
import ActivityCalendarStrip from "../activity/ActivityCalendarStrip";
import ProfileEmptyState from "./ProfileEmptyState";

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
      <section id="heatmap" className="border-b border-white/10 py-6">
        <ProfileEmptyState
          title="Recent Steam activity is unavailable."
          description="Set Steam Profile and Game Details to Public, then sync again. ClutchQ sessions can also build this heatmap."
        />
      </section>
    );
  }

  const sorted = [...days].sort((a, b) => new Date(a.date) - new Date(b.date));
  const totalMinutes = sorted.reduce((sum, day) => sum + (day.totalMinutes || 0), 0);
  const mostActive = sorted.reduce((best, day) => ((day.totalMinutes || 0) > (best?.totalMinutes || 0) ? day : best), sorted[0]);
  const streaks = buildStreaks(sorted);

  return (
    <section id="heatmap" className="border-b border-white/10 py-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="eyebrow">Steam activity</div>
          <h2 className="mt-2 text-2xl font-black text-clutch-text">Gaming consistency</h2>
          <p className="mt-2 text-sm text-clutch-muted">Daily playtime from Steam and ClutchQ sessions.</p>
        </div>
        <div className="text-sm font-semibold text-clutch-muted">{formatMinutes(totalMinutes)} tracked</div>
      </div>
      <div className="mt-5">
        <ActivityCalendarStrip days={sorted} compact />
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="border-l border-white/10 pl-3">
          <div className="text-xs text-clutch-muted">Total activity</div>
          <div className="mt-1 text-lg font-bold text-clutch-text">{formatMinutes(totalMinutes)}</div>
        </div>
        <div className="border-l border-white/10 pl-3">
          <div className="text-xs text-clutch-muted">Current streak</div>
          <div className="mt-1 text-lg font-bold text-clutch-text">{streaks.current} days</div>
        </div>
        <div className="border-l border-white/10 pl-3">
          <div className="text-xs text-clutch-muted">Best streak</div>
          <div className="mt-1 text-lg font-bold text-clutch-text">{streaks.best} days</div>
        </div>
        <div className="border-l border-white/10 pl-3">
          <div className="text-xs text-clutch-muted">Most active day</div>
          <div className="mt-1 text-lg font-bold text-clutch-text">{formatShortDate(mostActive?.date)}</div>
        </div>
      </div>
    </section>
  );
};

export default SteamActivityHeatmap;
