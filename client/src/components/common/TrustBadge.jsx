import { formatPercentage, safeNumber } from "../../utils/formatters";

const TrustBadge = ({ score }) => {
  const number = safeNumber(score, NaN);

  if (Number.isNaN(number)) {
    return <span className="inline-flex rounded-md border border-clutch-border bg-clutch-panelSoft px-2.5 py-1 text-xs font-semibold text-clutch-muted">No trust data</span>;
  }

  const tone =
    number >= 85
      ? "border-clutch-green/40 bg-clutch-green/10 text-green-200"
      : number >= 65
        ? "border-clutch-amber/40 bg-clutch-amber/10 text-amber-100"
        : "border-clutch-red/40 bg-clutch-red/10 text-red-100";

  return <span className={`inline-flex rounded-md border px-2.5 py-1 text-xs font-semibold ${tone}`}>Trust {formatPercentage(number)}</span>;
};

export default TrustBadge;
