import { formatHours, formatPercentage, safeNumber } from "../../utils/formatters";

const TopPlayersTable = ({ rows = [] }) => (
  <div className="premium-panel overflow-hidden">
    <div className="border-b border-white/[0.08] px-5 py-5">
      <h3 className="text-lg font-black text-white">Top Players</h3>
    </div>
    <div className="divide-y divide-white/[0.07]">
      {rows.length ? (
        rows.map((row) => (
          <div key={row.user?._id || row.rank} className="grid grid-cols-[48px_1fr_auto] items-center gap-4 px-5 py-4 transition hover:bg-white/[0.025]">
            <div className="text-lg font-black text-zinc-500">#{row.rank}</div>
            <div className="min-w-0">
              <div className="truncate font-bold text-white">{row.user?.name || "Player"}</div>
              <div className="text-sm text-zinc-400">
                {row.profile?.clutchTag || row.profile?.playerCode || "ClutchQ Player"} - {Number.isNaN(safeNumber(row.profile?.trustScore, NaN)) ? "No trust data" : `Trust ${formatPercentage(row.profile.trustScore)}`}
              </div>
            </div>
            <div className="text-right font-bold text-white">{formatHours(row.playtime?.totalMinutes)}</div>
          </div>
        ))
      ) : (
        <div className="p-5 text-sm text-zinc-400">No player data yet.</div>
      )}
    </div>
  </div>
);

export default TopPlayersTable;
