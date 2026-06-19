const colors = {
  open: "#22C55E",
  full: "#22D3EE",
  closed: "#F59E0B"
};

const LobbyHealthChart = ({ data = [] }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0) || 1;
  let offset = 0;

  return (
    <div className="card p-5">
      <h3 className="mb-4 text-lg font-black">Lobby health</h3>
      <svg viewBox="0 0 120 120" className="mx-auto h-44 w-44">
        {data.map((item) => {
          const dash = (item.value / total) * 100;
          const segment = (
            <circle
              key={item.label}
              cx="60"
              cy="60"
              r="44"
              fill="none"
              stroke={colors[item.label] || "#94A3B8"}
              strokeWidth="16"
              strokeDasharray={`${dash} ${100 - dash}`}
              strokeDashoffset={-offset}
              pathLength="100"
            />
          );
          offset += dash;
          return segment;
        })}
      </svg>
      <div className="mt-3 flex flex-wrap justify-center gap-3">
        {data.map((item) => <span key={item.label} className="text-sm text-clutch-muted">{item.label}: {item.value}</span>)}
      </div>
    </div>
  );
};

export default LobbyHealthChart;
