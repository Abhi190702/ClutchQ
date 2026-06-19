const axes = ["aggression", "support", "communication", "consistency", "adaptability"];
const labels = ["Aggression", "Support", "Communication", "Consistency", "Adaptability"];

const pointFor = (value, index, radius, center) => {
  const angle = (Math.PI * 2 * index) / axes.length - Math.PI / 2;
  const distance = (value / 100) * radius;
  return [center + Math.cos(angle) * distance, center + Math.sin(angle) * distance];
};

const polygonPoints = (stats, radius, center) => axes.map((axis, index) => pointFor(stats?.[axis] || 50, index, radius, center).join(",")).join(" ");

const PlaystyleRadar = ({ stats = {}, compareStats = null, size = 260 }) => {
  const center = size / 2;
  const radius = size * 0.36;

  return (
    <div className="card p-5">
      <div className="mb-4">
        <h3 className="text-lg font-black text-clutch-text">Playstyle radar</h3>
        <p className="text-sm text-clutch-muted">Custom SVG chart built without chart libraries.</p>
      </div>
      <svg width="100%" viewBox={`0 0 ${size} ${size}`} className="mx-auto max-w-[320px]">
        {[0.25, 0.5, 0.75, 1].map((scale) => (
          <polygon
            key={scale}
            points={axes.map((_, index) => pointFor(100 * scale, index, radius, center).join(",")).join(" ")}
            fill="none"
            stroke="#1E293B"
          />
        ))}
        {axes.map((axis, index) => {
          const [x, y] = pointFor(100, index, radius, center);
          const [labelX, labelY] = pointFor(119, index, radius, center);
          return (
            <g key={axis}>
              <line x1={center} y1={center} x2={x} y2={y} stroke="#1E293B" />
              <text x={labelX} y={labelY} textAnchor="middle" dominantBaseline="middle" fill="#94A3B8" fontSize="10" fontWeight="700">
                {labels[index]}
              </text>
            </g>
          );
        })}
        {compareStats && <polygon points={polygonPoints(compareStats, radius, center)} fill="rgba(139,92,246,0.22)" stroke="#8B5CF6" strokeWidth="2" />}
        <polygon points={polygonPoints(stats, radius, center)} fill="rgba(34,211,238,0.22)" stroke="#22D3EE" strokeWidth="2" />
      </svg>
    </div>
  );
};

export default PlaystyleRadar;
