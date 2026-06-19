const accentMap = {
  cyan: "#22D3EE",
  blue: "#3B82F6",
  violet: "#8B5CF6",
  green: "#22C55E",
  amber: "#F59E0B",
  red: "#EF4444"
};

const StatCard = ({ label, value, suffix = "", accent = "cyan" }) => {
  const isNumber = Number.isFinite(Number(value));
  const display = isNumber ? Math.round(Number(value)) : value;

  return (
    <div className="card p-5">
      <div className="mb-4 h-1 w-10 rounded-full" style={{ backgroundColor: accentMap[accent] || accentMap.cyan }} />
      <div className="text-3xl font-semibold text-clutch-text">{display}{suffix}</div>
      <div className="mt-1 text-sm text-clutch-muted">{label}</div>
    </div>
  );
};

export default StatCard;
