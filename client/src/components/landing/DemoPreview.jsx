import ScoreRing from "../common/ScoreRing";

const DemoPreview = () => (
  <section className="mx-auto max-w-6xl px-4 py-14 md:px-6">
    <div className="card grid gap-6 p-5 md:grid-cols-[0.8fr_1.2fr]">
      <div>
        <div className="eyebrow mb-3">Product preview</div>
        <h2 className="section-title">Simple fit scores with clear reasons.</h2>
        <p className="mt-4 text-sm leading-6 text-clutch-muted">
          Open a recommendation to see the criteria behind it: game, rank, role, trust, and availability.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {[91, 86, 74].map((score, index) => (
          <div key={score} className="rounded-lg border border-clutch-border bg-clutch-panelSoft p-4 text-center">
            <ScoreRing score={score} size={84} label={index === 0 ? "Squad" : "Match"} />
            <div className="mt-3 text-sm font-semibold text-clutch-text">{["Best Squad", "Open Lobby", "Next Invite"][index]}</div>
            <div className="mt-1 text-xs text-clutch-muted">Fit score</div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default DemoPreview;
