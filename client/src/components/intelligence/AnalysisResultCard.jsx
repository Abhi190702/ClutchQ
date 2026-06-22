const AnalysisResultCard = ({ result }) => {
  const analysis = result?.analysis || result;
  const performance = analysis?.performance || {};
  const warnings = result?.warnings || analysis?.warnings || [];

  if (!analysis) return null;

  return (
    <div className="rounded-[10px] border border-emerald-400/20 bg-emerald-500/10 p-4">
      <div className="text-sm font-black uppercase tracking-[0.18em] text-emerald-200">Scorecard analysis</div>
      <div className="mt-2 text-2xl font-black text-white">{performance.overall ?? "--"} overall</div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {[
          ["Combat", performance.combat],
          ["Support", performance.support],
          ["Impact", performance.impact]
        ].map(([label, value]) => (
          <div key={label} className="border-l border-white/10 pl-3">
            <div className="text-lg font-black text-white">{value ?? "--"}</div>
            <div className="text-xs font-bold text-zinc-400">{label}</div>
          </div>
        ))}
      </div>
      {analysis.summary?.length ? (
        <ul className="mt-4 space-y-1 text-sm text-zinc-300">
          {analysis.summary.map((item) => <li key={item}>{item}</li>)}
        </ul>
      ) : null}
      {warnings.length ? <div className="mt-4 text-xs font-semibold text-amber-100">{warnings[0]}</div> : null}
    </div>
  );
};

export default AnalysisResultCard;
