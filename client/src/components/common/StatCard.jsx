import { useEffect, useState } from "react";

const accentMap = {
  cyan: "#22D3EE",
  blue: "#3B82F6",
  violet: "#8B5CF6",
  green: "#22C55E",
  amber: "#F59E0B",
  red: "#EF4444"
};

const StatCard = ({ label, value, suffix = "", accent = "cyan" }) => {
  const [display, setDisplay] = useState(0);
  const isNumber = Number.isFinite(Number(value));

  useEffect(() => {
    if (!isNumber) return;
    const target = Number(value);
    let frame = 0;
    const timer = window.setInterval(() => {
      frame += 1;
      setDisplay(Math.round((target * frame) / 18));
      if (frame >= 18) window.clearInterval(timer);
    }, 18);
    return () => window.clearInterval(timer);
  }, [value, isNumber]);

  return (
    <div className="card p-5">
      <div className="mb-4 h-1 w-12 rounded-full" style={{ backgroundColor: accentMap[accent] || accentMap.cyan }} />
      <div className="text-3xl font-black text-clutch-text">{isNumber ? display : value}{suffix}</div>
      <div className="mt-1 text-sm text-clutch-muted">{label}</div>
    </div>
  );
};

export default StatCard;
