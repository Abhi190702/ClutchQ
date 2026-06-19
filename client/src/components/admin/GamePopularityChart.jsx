const GamePopularityChart = ({ data = [] }) => {
  const max = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className="card p-5">
      <h3 className="mb-4 text-lg font-black">Game popularity</h3>
      <div className="space-y-3">
        {data.map((item) => (
          <div key={item.label}>
            <div className="mb-1 flex justify-between text-sm">
              <span className="font-semibold text-clutch-text">{item.label}</span>
              <span className="text-clutch-muted">{item.value}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-clutch-panelSoft">
              <div className="h-full rounded-full bg-clutch-cyan" style={{ width: `${(item.value / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GamePopularityChart;
