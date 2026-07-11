const members = [
  ["Abhijeet", "Duelist", "Ready"],
  ["CaptainRex", "IGL", "Voice on"],
  ["NovaSentinel", "Sentinel", "Ready"]
];

const LiveSquadPreview = () => (
  <section className="mx-auto grid max-w-[1540px] gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[0.78fr_1.22fr] lg:items-center lg:py-20">
    <div className="flex flex-col justify-center">
      <div className="eyebrow mb-3">Live squad preview</div>
      <h2 className="text-3xl font-black tracking-[-0.04em] text-white sm:text-5xl">Know the squad before you queue.</h2>
      <p className="mt-5 max-w-xl text-base leading-7 text-zinc-300">
        ClutchQ explains role fit, timing, voice readiness, trust, and gameplay rhythm before the match starts.
      </p>
      <div className="mt-8 grid max-w-xl gap-4 sm:grid-cols-2">
        {["Know why someone fits", "Find players online when you are", "Avoid unreliable teammates", "Turn lobbies into voice-ready squads"].map((item) => (
          <div key={item} className="flex gap-3 border-t border-white/[0.08] pt-4 text-sm font-bold leading-6 text-zinc-200">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-clutch-blue" />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>

    <div className="premium-panel p-5 sm:p-7">
      <div className="flex flex-col gap-5 border-b border-white/10 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="eyebrow mb-2">Valorant lobby</div>
          <h3 className="text-3xl font-black text-white">Night ranked stack</h3>
          <p className="mt-2 text-sm text-zinc-400">India - Gold lobby - Controller needed</p>
        </div>
        <div className="rounded-3xl bg-white p-4 text-center text-black">
          <div className="text-3xl font-black">91%</div>
          <div className="text-xs font-black uppercase tracking-[0.14em]">Compatibility</div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_0.8fr]">
        <div className="space-y-3">
          {members.map(([name, role, status]) => (
            <div key={name} className="flex items-center justify-between gap-4 border-b border-white/[0.07] px-1 py-4 last:border-b-0">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10 text-sm font-black text-white">{name[0]}</div>
                <div>
                  <div className="font-black text-white">{name}</div>
                  <div className="text-sm text-zinc-400">{role}</div>
                </div>
              </div>
              <span className="rounded-full bg-emerald-400/[0.14] px-3 py-1 text-xs font-black text-emerald-200">{status}</span>
            </div>
          ))}
        </div>

        <div className="rounded-[24px] border border-white/[0.08] bg-white/[0.035] p-5">
          <div className="text-sm font-black uppercase tracking-[0.16em] text-zinc-400">Squad read</div>
          <div className="mt-4 space-y-4">
            <div>
              <div className="text-sm text-zinc-400">Needed</div>
              <div className="text-xl font-black text-white">Controller with comms</div>
            </div>
            <div>
              <div className="text-sm text-zinc-400">Voice</div>
              <div className="text-xl font-black text-white">Discord ready</div>
            </div>
            <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm leading-6 text-amber-100">
              One member has limited availability overlap after midnight.
            </div>
            <button type="button" className="btn-primary w-full rounded-xl py-3">
              View squad
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default LiveSquadPreview;
