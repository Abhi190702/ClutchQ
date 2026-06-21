import { formatHours, formatNumber } from "../../utils/formatters";

const ActivityHero = ({ snapshot, active, onEndActive }) => (
  <section className="flex flex-col gap-6 border-b border-white/10 pb-8 lg:flex-row lg:items-end lg:justify-between">
    <div>
      <div className="eyebrow mb-3">Gaming rhythm</div>
      <h1 className="max-w-3xl text-4xl font-black tracking-tight text-white md:text-6xl">Gaming Activity</h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-400">
        Your play rhythm, sessions, squad fit, and match history in one clean read.
      </p>
    </div>

    <div className="min-w-[280px] rounded-2xl bg-white/[0.045] p-4">
      {active ? (
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.2em] text-clutch-blue">Currently playing</div>
            <div className="mt-1 text-lg font-black text-white">{active.gameName}</div>
          </div>
          <button type="button" className="btn-primary py-2" onClick={() => onEndActive?.(active)}>
            End
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-xl font-black text-white">{formatHours(snapshot.weekMinutes)}</div>
            <div className="text-xs text-zinc-500">week</div>
          </div>
          <div>
            <div className="text-xl font-black text-white">{formatNumber(snapshot.sessionsCount)}</div>
            <div className="text-xs text-zinc-500">sessions</div>
          </div>
          <div>
            <div className="text-xl font-black text-white">{snapshot.streak || 0}d</div>
            <div className="text-xs text-zinc-500">streak</div>
          </div>
        </div>
      )}
    </div>
  </section>
);

export default ActivityHero;
