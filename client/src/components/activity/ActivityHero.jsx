import { formatHours, formatNumber } from "../../utils/formatters";
import SoftGlow from "../common/SoftGlow";

const ActivityHero = ({ snapshot, active, onEndActive }) => (
  <section className="relative overflow-hidden rounded-[18px] border border-white/10 bg-white/[0.025] px-5 py-6 md:px-7">
    <SoftGlow />
    <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <div className="eyebrow mb-3">Activity</div>
        <h1 className="max-w-3xl text-4xl font-black tracking-tight text-white">Gaming rhythm</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-400">
          {formatHours(snapshot.weekMinutes)} this week · {formatNumber(snapshot.sessionsCount)} sessions · {snapshot.streak || 0} day streak
        </p>
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

export default ActivityHero;
