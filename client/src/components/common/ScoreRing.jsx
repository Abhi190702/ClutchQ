import { useEffect, useState } from "react";

const ScoreRing = ({ score = 0, size = 88, label = "Match" }) => {
  const [animatedScore, setAnimatedScore] = useState(0);
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedScore / 100) * circumference;

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setAnimatedScore(Math.round(score)));
    return () => window.cancelAnimationFrame(id);
  }, [score]);

  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#1E293B" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={animatedScore >= 80 ? "#22C55E" : animatedScore >= 60 ? "#22D3EE" : "#F59E0B"}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-xl font-black text-clutch-text">{Math.round(animatedScore)}%</div>
        <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-clutch-muted">{label}</div>
      </div>
    </div>
  );
};

export default ScoreRing;
