const SquadChemistryGraph = ({ members = [], pairwiseScores = [] }) => {
  const size = 320;
  const center = size / 2;
  const radius = 112;
  const nodes = members.map((member, index) => {
    const angle = (Math.PI * 2 * index) / Math.max(1, members.length) - Math.PI / 2;
    return {
      id: String(member._id || member.userId?._id || member.userId),
      label: member.displayName || member.userId?.name || `P${index + 1}`,
      x: center + Math.cos(angle) * radius,
      y: center + Math.sin(angle) * radius
    };
  });

  const findNode = (name) => nodes.find((node) => node.label === name) || nodes[0];

  return (
    <div className="card p-5">
      <div className="mb-4">
        <h3 className="text-lg font-black">Squad chemistry graph</h3>
        <p className="text-sm text-clutch-muted">Line thickness shows pairwise compatibility.</p>
      </div>
      <svg viewBox={`0 0 ${size} ${size}`} className="mx-auto max-w-[360px]">
        {pairwiseScores.map((pair) => {
          const first = findNode(pair.players[0]);
          const second = findNode(pair.players[1]);
          if (!first || !second) return null;
          return (
            <g key={pair.players.join("-")}>
              <line x1={first.x} y1={first.y} x2={second.x} y2={second.y} stroke={pair.score >= 80 ? "#22C55E" : pair.score >= 60 ? "#22D3EE" : "#F59E0B"} strokeWidth={Math.max(1.5, pair.score / 25)} opacity="0.75" />
              <text x={(first.x + second.x) / 2} y={(first.y + second.y) / 2} fill="#F8FAFC" fontSize="10" fontWeight="800">
                {pair.score}
              </text>
            </g>
          );
        })}
        {nodes.map((node) => (
          <g key={node.id}>
            <circle cx={node.x} cy={node.y} r="25" fill="#111827" stroke="#22D3EE" />
            <text x={node.x} y={node.y + 4} textAnchor="middle" fill="#F8FAFC" fontSize="10" fontWeight="800">
              {node.label.slice(0, 3)}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};

export default SquadChemistryGraph;
