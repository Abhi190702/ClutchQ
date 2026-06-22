import SoftGlow from "../common/SoftGlow";
import GameProfileShelf from "./GameProfileShelf";
import SituationalSignals from "./SituationalSignals";

const GameplayGraphPanel = ({ graph }) => {
  if (!graph) {
    return (
      <section className="border-b border-white/10 py-6">
        <div className="eyebrow mb-3">Gameplay Graph</div>
        <h2 className="text-2xl font-black text-white">Graph is building</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-400">Start sessions, sync Steam, or upload scorecards to build your gameplay intelligence profile.</p>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden rounded-[16px] border border-white/10 bg-white/[0.025] p-5">
      <SoftGlow />
      <div className="relative">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="eyebrow mb-3">Gameplay Graph</div>
            <h2 className="text-3xl font-black tracking-tight text-white">{graph.style?.mainStyle || "Gameplay profile"}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">{graph.style?.bestSquadFit || "Build more signals to refine your best squad fit."}</p>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:min-w-[260px]">
            <div className="border-l border-white/10 pl-3">
              <div className="text-3xl font-black text-white">{graph.gameplayProfileScore ?? "--"}</div>
              <div className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-600">Profile score</div>
            </div>
            <div className="border-l border-white/10 pl-3">
              <div className="text-3xl font-black text-white">{Math.round((Number(graph.confidence) || 0) * 100)}%</div>
              <div className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-600">Confidence</div>
            </div>
          </div>
        </div>

        <div className="mt-7 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div>
            <div className="mb-4 text-sm font-black uppercase tracking-[0.18em] text-zinc-500">Situational strengths</div>
            <SituationalSignals signals={graph.situationalStrengths || []} limit={3} />
          </div>
          <div>
            <div className="mb-4 text-sm font-black uppercase tracking-[0.18em] text-zinc-500">Top game profiles</div>
            <GameProfileShelf games={graph.gameProfiles || []} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default GameplayGraphPanel;
