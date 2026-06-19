const TrustBadge = ({ score = 0 }) => {
  const tone =
    score >= 85
      ? "border-clutch-green/40 bg-clutch-green/10 text-green-200"
      : score >= 65
        ? "border-clutch-amber/40 bg-clutch-amber/10 text-amber-100"
        : "border-clutch-red/40 bg-clutch-red/10 text-red-100";

  return <span className={`inline-flex rounded-md border px-2.5 py-1 text-xs font-semibold ${tone}`}>Trust {Math.round(score)}%</span>;
};

export default TrustBadge;
