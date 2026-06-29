import { useState } from "react";
import DetailDrawer from "../common/DetailDrawer";
import SoftGlow from "../common/SoftGlow";
import GameProfileShelf from "./GameProfileShelf";
import SituationalSignals from "./SituationalSignals";

const toConfidencePercent = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.round(numeric <= 1 ? numeric * 100 : numeric);
};

const GameplayGraphPanel = ({ graph }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (!graph) {
    return (
      <section className="border-b border-white/10 py-6">
        <div className="eyebrow mb-3">Gameplay Graph</div>
        <h2 className="text-2xl font-black text-white">Graph is building</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-400">Start sessions, sync Steam, or upload scorecards to build your gameplay intelligence profile.</p>
      </section>
    );
  }

  const recommendations = graph.recommendations?.length
    ? graph.recommendations.slice(0, 3)
    : ["Start one session and add a scorecard to improve graph confidence."];
  const confidence = toConfidencePercent(graph.confidence);

  return (
    <section className="relative overflow-hidden rounded-[18px] border border-white/10 bg-white/[0.025] p-5 md:p-6">
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
              <div className="text-3xl font-black text-white">{confidence}%</div>
              <div className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-600">Confidence</div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {recommendations.map((item, index) => (
            <div key={`${item}-${index}`} className="rounded-[14px] border border-white/10 bg-black/15 p-4">
              <div className="text-xs font-black uppercase tracking-[0.16em] text-zinc-600">Recommendation {index + 1}</div>
              <p className="mt-2 text-sm font-bold leading-6 text-zinc-200">{item}</p>
            </div>
          ))}
        </div>

        <div className="mt-7 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div>
            <div className="mb-4 text-sm font-black uppercase tracking-[0.18em] text-zinc-500">Situational strengths</div>
            <SituationalSignals signals={graph.situationalStrengths || []} limit={5} />
          </div>
          <div>
            <div className="mb-4 text-sm font-black uppercase tracking-[0.18em] text-zinc-500">Top game profiles</div>
            <GameProfileShelf games={graph.gameProfiles || []} />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" className="btn-secondary" onClick={() => setDrawerOpen(true)}>
            View full graph
          </button>
        </div>
      </div>

      <DetailDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Full Gameplay Graph"
        subtitle="The underlying style, recommendations, game profiles, strengths, and teammate edges."
      >
        <div className="space-y-6">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.16em] text-zinc-500">Best squad fit</div>
            <p className="mt-2 text-base font-bold leading-7 text-white">{graph.style?.bestSquadFit || "Build more signals to refine your best squad fit."}</p>
          </div>
          <div>
            <div className="text-xs font-black uppercase tracking-[0.16em] text-zinc-500">Recommendations</div>
            <div className="mt-3 space-y-2">
              {recommendations.map((item, index) => (
                <p key={`${item}-drawer-${index}`} className="rounded-[12px] bg-white/[0.04] px-3 py-2 text-sm leading-6 text-zinc-300">{item}</p>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs font-black uppercase tracking-[0.16em] text-zinc-500">All strengths</div>
            <div className="mt-3">
              <SituationalSignals signals={graph.situationalStrengths || []} limit={8} />
            </div>
          </div>
          <div>
            <div className="text-xs font-black uppercase tracking-[0.16em] text-zinc-500">Teammate edges</div>
            <div className="mt-3 divide-y divide-white/10">
              {(graph.teammateEdges || []).slice(0, 6).map((edge) => (
                <div key={edge.userId || edge.name} className="py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-bold text-white">{edge.name || "Teammate"}</span>
                    <span className="font-black text-sky-200">{edge.compatibility ?? "--"}%</span>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-zinc-400">{edge.reason || "Compatibility improves as you play and rate sessions together."}</p>
                </div>
              ))}
              {!graph.teammateEdges?.length ? <p className="text-sm text-zinc-400">Join rooms and collect feedback to build teammate edges.</p> : null}
            </div>
          </div>
        </div>
      </DetailDrawer>
    </section>
  );
};

export default GameplayGraphPanel;
