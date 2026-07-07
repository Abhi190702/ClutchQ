const members = [
  ["Abhijeet", "Duelist", "Ready"],
  ["CaptainRex", "IGL", "Voice on"],
  ["NovaSentinel", "Sentinel", "Ready"]
];

const LiveSquadPreview = () => (
  <section className="mx-auto grid max-w-[1480px] gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.82fr_1.18fr] lg:py-16">
    <div className="flex flex-col justify-center">
      <div className="eyebrow mb-3">Live squad preview</div>
      <h2 className="text-3xl font-black tracking-tight text-white sm:text-5xl">Know the squad before you queue.</h2>
      <p className="mt-5 max-w-xl text-base leading-7 text-zinc-300">
        ClutchQ explains role fit, timing, voice readiness, trust, and gameplay rhythm before the match starts.
      </p>
      <div className="mt-7 grid max-w-xl gap-3 sm:grid-cols-2">
        {["Know why someone fits", "Find players online when you are", "Avoid unreliable teammates", "Turn lobbies into voice-ready squads"].map((item) => (
          <div key={item} className="rounded-2xl bg-white/[0.045] px-4 py-3 text-sm font-bold text-zinc-200">
            {item}
          </div>
        ))}
      </div>
    </div>

    <div className="rounded-[28px] border border-white/10 bg-[#1d1d22] p-5 shadow-2xl shadow-black/20 sm:p-6">
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
            <div key={name} className="flex items-center justify-between gap-4 rounded-2xl bg-black/[0.24] p-4">
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

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
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
