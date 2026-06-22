import { formatHours, formatNumber } from "../../utils/formatters";
import SoftGlow from "../common/SoftGlow";

const ActivityHero = ({ snapshot, rhythmSummary, active, onEndActive }) => {
  const summary = rhythmSummary || {};
  const totalTracked = summary.totalMinutes ?? snapshot.weekMinutes;
  const activeDays = summary.activeDays ?? 0;
  const bestDay = summary.bestDayMinutes ?? 0;
  const rhythmScore = summary.rhythmScore ?? 0;

  return (
  <section className="relative overflow-hidden rounded-[18px] border border-white/10 bg-white/[0.025] px-5 py-6 md:px-7">
    <SoftGlow />
    <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <div className="eyebrow mb-3">Gameplay intelligence</div>
        <h1 className="max-w-3xl text-4xl font-black tracking-tight text-white">Gaming rhythm</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-400">
          Session history, scorecards, teammate feedback, and Steam signals.
        </p>
        <div className="mt-6 grid max-w-3xl grid-cols-2 gap-4 md:grid-cols-4">
          {[
            ["Tracked", formatHours(totalTracked)],
            ["Active days", formatNumber(activeDays)],
            ["Best day", formatHours(bestDay)],
            ["Rhythm", `${rhythmScore || 0}%`]
          ].map(([label, value]) => (
            <div key={label} className="border-l border-white/10 pl-3">
              <div className="text-xl font-black text-white">{value}</div>
              <div className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-600">{label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="min-w-[260px] border-y border-white/10 py-4 lg:border-y-0 lg:border-l lg:pl-6">
        {active ? (
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.14em] text-clutch-blue">Currently playing</div>
              <div className="mt-1 text-lg font-black text-white">{active.gameName}</div>
            </div>
            <button type="button" className="btn-primary py-2" onClick={() => onEndActive?.(active)}>
              End
            </button>
          </div>
        ) : (
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
