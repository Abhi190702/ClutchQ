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
  <section className="page-intro px-6 py-8 md:px-10 md:py-10">
    <SoftGlow />
    <div className="relative grid gap-7 xl:grid-cols-[minmax(0,1fr)_380px] xl:items-end">
      <div>
        <div className="eyebrow mb-3">Gameplay intelligence</div>
        <h1 className="max-w-3xl text-4xl font-black tracking-[-0.045em] text-white md:text-6xl">Gaming rhythm</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-400">
          Your sessions, scorecards, teammate feedback, and Steam signals.
        </p>
        <div className="mt-8 grid max-w-4xl grid-cols-2 gap-0 overflow-hidden rounded-[22px] border border-white/[0.07] bg-black/15 md:grid-cols-5">
          {[
            ["Rhythm score", `${rhythmScore || 0}%`],
            ["Tracked", formatHours(totalTracked)],
            ["Active days", formatNumber(activeDays)],
            ["Best day", formatHours(bestDay)],
            ["Streak", `${formatNumber(currentStreak)}d`]
          ].map(([label, value]) => (
            <div key={label} className="border-b border-r border-white/[0.07] px-4 py-4 md:border-b-0 last:border-r-0">
              <div className="text-xl font-black text-white">{value}</div>
              <div className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-600">{label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[24px] border border-white/[0.09] bg-black/25 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)] backdrop-blur-xl">
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
