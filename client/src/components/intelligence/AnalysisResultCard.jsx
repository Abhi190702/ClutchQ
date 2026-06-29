import { formatPercentage } from "../../utils/formatters";

const AnalysisResultCard = ({ result }) => {
  const analysis = result?.analysis || result;
  const performance = analysis?.performance || {};
  const signals = analysis?.situationalSignals || {};
  const warnings = result?.warnings || analysis?.warnings || [];
  const source = analysis?.source || result?.source || "analyzer";
  const confidence = analysis?.confidence ?? result?.confidence;
  const confidencePercent = confidence === undefined ? null : Number(confidence) <= 1 ? Number(confidence) * 100 : Number(confidence);
  const sourceLabel = source === "fallback" ? "lightweight analyzer" : source;

  if (!analysis) return null;

  return (
    <div className="rounded-[10px] border border-emerald-400/20 bg-emerald-500/10 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-sm font-black uppercase tracking-[0.18em] text-emerald-200">Scorecard analysis</div>
          <div className="mt-2 text-2xl font-black text-white">{performance.overall ?? "--"} overall</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-black/20 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-emerald-100">{sourceLabel}</span>
          {confidencePercent !== null ? <span className="rounded-full bg-black/20 px-3 py-1 text-xs font-black text-emerald-100">{formatPercentage(confidencePercent)} confidence</span> : null}
        </div>
      </div>
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
      {Object.keys(signals).length ? (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {Object.entries(signals).slice(0, 4).map(([key, value]) => (
            <div key={key} className="rounded-lg bg-black/15 px-3 py-2">
              <div className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-100/70">{key.replace(/([A-Z])/g, " $1")}</div>
              <div className="mt-1 text-sm font-black text-white">{value}</div>
            </div>
          ))}
        </div>
      ) : null}
      {analysis.summary?.length ? (
        <ul className="mt-4 space-y-1 text-sm text-zinc-300">
          {analysis.summary.slice(0, 3).map((item) => <li key={item}>{item}</li>)}
        </ul>
      ) : null}
      {warnings.length ? <div className="mt-4 text-xs font-semibold text-amber-100">{warnings[0]}</div> : null}
    </div>
  );
};

export default AnalysisResultCard;
