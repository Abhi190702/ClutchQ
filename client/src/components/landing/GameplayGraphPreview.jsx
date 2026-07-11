import { gameplaySignals } from "../../data/landingShowcase";

const GameplayGraphPreview = () => (
  <section className="mx-auto grid max-w-[1540px] gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[0.82fr_1.18fr] lg:items-center lg:py-20">
    <div>
      <div className="eyebrow mb-3">Gameplay Graph</div>
      <h2 className="text-3xl font-black tracking-[-0.04em] text-white sm:text-5xl">Your squad history becomes a Gameplay Graph.</h2>
      <p className="mt-5 max-w-xl text-base leading-7 text-zinc-300">
        After sessions, scorecards, and teammate feedback, ClutchQ builds a living profile of your strengths, rhythm, and best teammate fits.
      </p>
      <p className="mt-5 text-sm font-bold uppercase tracking-[0.16em] text-zinc-500">
        Powered by sessions, scorecards, Steam signals, and feedback.
      </p>
    </div>

    <div className="premium-panel p-5 sm:p-7">
      <div className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="rounded-3xl bg-black/[0.26] p-5">
          <div className="flex items-center gap-4">
            <div className="grid h-16 w-16 place-items-center rounded-3xl bg-white text-2xl font-black text-black">A</div>
            <div>
              <div className="text-2xl font-black text-white">Abhijeet</div>
              <div className="text-sm text-zinc-400">Impact flex - Ranked squad with comms</div>
            </div>
          </div>
          <div className="mt-8 rounded-3xl border border-white/10 p-5">
            <div className="text-sm font-black uppercase tracking-[0.16em] text-zinc-500">Gameplay profile score</div>
            <div className="mt-3 flex items-end gap-3">
              <div className="text-6xl font-black text-white">84</div>
              <div className="pb-2 text-sm font-bold text-emerald-200">Confidence: Medium/High</div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {gameplaySignals.map((signal) => (
            <div key={signal.label}>
              <div className="mb-2 flex items-center justify-between text-sm font-black">
                <span className="text-zinc-300">{signal.label}</span>
                <span className="text-white">{signal.value}</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-gradient-to-r from-clutch-blue to-emerald-300" style={{ width: `${signal.value}%` }} />
              </div>
            </div>
          ))}
          <div className="rounded-3xl border border-emerald-300/20 bg-emerald-300/10 p-5">
            <div className="text-sm font-black uppercase tracking-[0.16em] text-emerald-200">Best teammate edge</div>
            <div className="mt-3 text-2xl font-black text-white">CaptainRex - 92% fit</div>
            <p className="mt-2 text-sm leading-6 text-emerald-100">Shared Valorant rhythm + role balance.</p>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default GameplayGraphPreview;
