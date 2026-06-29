import { formatHours, formatNumber } from "../../utils/formatters";
import SoftGlow from "../common/SoftGlow";

const ActivityHero = ({ snapshot, rhythmSummary, active, onEndActive, children }) => {
  const summary = rhythmSummary || {};
  const totalTracked = summary.totalMinutes ?? snapshot.weekMinutes;
  const activeDays = summary.activeDays ?? 0;
  const bestDay = summary.bestDayMinutes ?? 0;
  const rhythmScore = summary.rhythmScore ?? 0;
  const currentStreak = summary.currentStreak ?? 0;

  return (
  <section className="relative overflow-hidden rounded-[18px] border border-white/10 bg-white/[0.025] px-5 py-6 md:px-7">
    <SoftGlow />
    <div className="relative grid gap-7 xl:grid-cols-[minmax(0,1fr)_380px] xl:items-end">
      <div>
        <div className="eyebrow mb-3">Gameplay intelligence</div>
        <h1 className="max-w-3xl text-4xl font-black tracking-tight text-white">Gaming rhythm</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-400">
          Your sessions, scorecards, teammate feedback, and Steam signals.
        </p>
        <div className="mt-6 grid max-w-4xl grid-cols-2 gap-4 md:grid-cols-5">
          {[
            ["Rhythm score", `${rhythmScore || 0}%`],
            ["Tracked", formatHours(totalTracked)],
            ["Active days", formatNumber(activeDays)],
            ["Best day", formatHours(bestDay)],
            ["Streak", `${formatNumber(currentStreak)}d`]
          ].map(([label, value]) => (
            <div key={label} className="border-l border-white/10 pl-3">
              <div className="text-xl font-black text-white">{value}</div>
              <div className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-600">{label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[16px] border border-white/10 bg-black/20 p-4">
        {active ? (
          <div className="mb-4 flex items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.14em] text-clutch-blue">Currently playing</div>
              <div className="mt-1 text-lg font-black text-white">{active.gameName}</div>
            </div>
            <button type="button" className="btn-primary py-2" onClick={() => onEndActive?.(active)}>
              End Match
            </button>
          </div>
        ) : null}
        {children || (
          <div className="text-sm leading-6 text-zinc-400">
            Start a session to track comms, teammates, and match quality without crowding this page.
          </div>
        )}
      </div>
    </div>
  </section>
  );
};

export default ActivityHero;
