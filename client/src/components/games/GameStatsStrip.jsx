const hours = (minutes = 0) => `${Math.round(minutes / 60)}h`;

const GameStatsStrip = ({ game, stats }) => {
  const rows = [
    ["Active Rooms", stats?.activeRooms ?? game?.activeRooms ?? 0],
    ["Players Online", stats?.activePlayers ?? game?.activePlayers ?? 0],
    ["Avg Wait", `${game?.avgWaitMinutes || 5}m`],
    ["Team Size", game?.teamSize || 5]
  ];

  if (stats?.yourStats) {
    rows.push(["Your Playtime", hours(stats.yourStats.totalMinutes)], ["This Week", hours(stats.yourStats.weeklyMinutes)]);
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {rows.map(([label, value]) => (
        <div key={label} className="rounded-[10px] border border-[#2f2f36] bg-[#202024] p-4">
          <div className="text-2xl font-black text-white">{value}</div>
          <div className="mt-1 text-sm text-zinc-400">{label}</div>
        </div>
      ))}
    </div>
  );
};

export default GameStatsStrip;
