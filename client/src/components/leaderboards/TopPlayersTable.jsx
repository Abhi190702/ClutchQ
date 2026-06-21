import { formatHours } from "../../utils/formatters";

const TopPlayersTable = ({ rows = [] }) => (
  <div className="overflow-hidden rounded-[10px] border border-[#2f2f36] bg-[#202024]">
    <div className="border-b border-[#2f2f36] p-4">
      <h3 className="text-lg font-black text-white">Top Players</h3>
    </div>
    <div className="divide-y divide-[#2f2f36]">
      {rows.length ? (
        rows.map((row) => (
          <div key={row.user?._id || row.rank} className="grid grid-cols-[48px_1fr_auto] items-center gap-3 p-4">
            <div className="text-lg font-black text-zinc-500">#{row.rank}</div>
            <div className="min-w-0">
              <div className="truncate font-bold text-white">{row.user?.name || "Player"}</div>
              <div className="text-sm text-zinc-400">
                {row.profile?.clutchTag || row.profile?.playerCode || "ClutchQ Player"} - Trust {row.profile?.trustScore || 70}
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
