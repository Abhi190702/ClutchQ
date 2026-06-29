const SituationalSignals = ({ signals = [], limit = 5 }) => {
  if (!signals.length) {
    return <p className="text-sm leading-6 text-zinc-400">Situational strengths will appear after scorecards, sessions, or teammate feedback.</p>;
  }

  return (
    <div className="space-y-4">
      {signals.slice(0, limit).map((signal) => (
        <div key={signal.key || signal.label}>
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-sm font-black text-white">{signal.label}</div>
              {signal.evidence ? (
                <details className="group mt-1">
                  <summary className="cursor-pointer list-none text-xs font-bold text-clutch-blue transition hover:text-sky-300">
                    View evidence
                  </summary>
                  <p className="mt-1 text-xs leading-5 text-zinc-500">{signal.evidence}</p>
                </details>
              ) : null}
            </div>
            <div className="text-sm font-black text-white">{signal.score ?? "--"}</div>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
            <div className="h-full rounded-full bg-clutch-blue" style={{ width: `${Math.max(0, Math.min(100, Number(signal.score) || 0))}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
};

export default SituationalSignals;
