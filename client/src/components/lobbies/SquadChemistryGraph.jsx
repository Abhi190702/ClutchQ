import EmptyState from "../common/EmptyState";

const SquadChemistryGraph = ({ members = [], pairwiseScores = [] }) => {
  if (members.length < 2) {
    return (
      <EmptyState
        compact
        eyebrow="Squad fit"
        title="Need one more teammate"
        description="Pairwise chemistry appears after at least two lobby members are present."
      />
    );
  }

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

  const findNode = (name) => nodes.find((node) => node.label === name) || null;

  return (
    <div className="card p-5">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Squad fit</h3>
        <p className="text-sm text-clutch-muted">Connections show pairwise compatibility.</p>
      </div>
      <svg viewBox={`0 0 ${size} ${size}`} className="mx-auto max-w-[360px]">
        {pairwiseScores.map((pair) => {
          const players = Array.isArray(pair.players) ? pair.players : [];
          const first = findNode(players[0]);
          const second = findNode(players[1]);
          if (!first || !second) return null;
          return (
            <g key={players.join("-") || `${first.id}-${second.id}`}>
              <line x1={first.x} y1={first.y} x2={second.x} y2={second.y} stroke={pair.score >= 80 ? "#34D399" : pair.score >= 60 ? "#60A5FA" : "#FBBF24"} strokeWidth={Math.max(1.5, pair.score / 25)} opacity="0.75" />
              <text x={(first.x + second.x) / 2} y={(first.y + second.y) / 2} fill="#F8FAFC" fontSize="10" fontWeight="600">
                {pair.score}
              </text>
            </g>
          );
        })}
        {nodes.map((node) => (
          <g key={node.id}>
            <circle cx={node.x} cy={node.y} r="25" fill="#111827" stroke="#60A5FA" />
            <text x={node.x} y={node.y + 4} textAnchor="middle" fill="#F8FAFC" fontSize="10" fontWeight="600">
              {node.label.slice(0, 3)}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};

export default SquadChemistryGraph;
