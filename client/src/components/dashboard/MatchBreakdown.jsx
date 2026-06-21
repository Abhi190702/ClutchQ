import EmptyState from "../common/EmptyState";

const statusTone = {
  matched: "text-green-200 border-clutch-green/30 bg-clutch-green/10",
  partial: "text-amber-100 border-clutch-amber/30 bg-clutch-amber/10",
  warning: "text-red-100 border-clutch-red/30 bg-clutch-red/10"
};

const MatchBreakdown = ({ match }) => {
  const breakdown = match?.breakdown || [];

  if (!breakdown.length) {
    return (
      <EmptyState
        compact
        title="No compatibility details yet"
        description="Once a real match is available, role, region, rank, and mic signals will appear here."
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-2">
        {breakdown.map((item) => (
          <div key={item.key} className="rounded-lg border border-clutch-border bg-clutch-panelSoft p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-bold text-clutch-text">{item.label}</div>
              <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${statusTone[item.status] || statusTone.partial}`}>
                +{Math.max(0, Number(item.score) || 0)}/{Math.max(0, Number(item.max) || 0)}
              </span>
            </div>
            {item.reason ? <p className="mt-1 text-xs leading-5 text-clutch-muted">{item.reason}</p> : null}
          </div>
        ))}
      </div>
      {!!match?.warnings?.length && (
        <div className="rounded-lg border border-clutch-amber/40 bg-clutch-amber/10 p-3 text-xs text-amber-100">
          <div className="mb-1 font-semibold">Warnings</div>
          {match.warnings.map((warning) => (
            <div key={warning}>{warning}</div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MatchBreakdown;
