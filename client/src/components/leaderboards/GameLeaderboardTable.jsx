import { formatHours } from "../../utils/formatters";

const GameLeaderboardTable = ({ rows = [] }) => (
  <div className="premium-panel overflow-hidden">
    <div className="border-b border-white/[0.08] px-5 py-5">
      <h3 className="text-lg font-black text-white">Most Played Games</h3>
    </div>
    <div className="divide-y divide-white/[0.07]">
      {rows.length ? (
        rows.map((row) => (
          <div key={row.game?.slug || row.rank} className="grid grid-cols-[48px_1fr_auto] items-center gap-4 px-5 py-4 transition hover:bg-white/[0.025]">
            <div className="text-lg font-black text-zinc-500">#{row.rank}</div>
            <div className="flex min-w-0 items-center gap-3">
              <div className="h-14 w-11 overflow-hidden rounded-[14px] bg-[#111218] ring-1 ring-white/[0.08]">
                {row.game?.posterUrl ? <img src={row.game.posterUrl} alt={row.game.title} loading="lazy" className="h-full w-full object-cover" /> : null}
              </div>
              <div className="min-w-0">
                <div className="truncate font-bold text-white">{row.game?.title}</div>
                <div className="text-sm text-zinc-400">{row.sessions || 0} sessions - {row.activePlayers || 0} players</div>
              </div>
            </div>
            <div className="text-right font-bold text-white">{formatHours(row.totalMinutes)}</div>
          </div>
        ))
      ) : (
        <div className="p-5 text-sm text-zinc-400">No leaderboard data yet.</div>
      )}
    </div>
  </div>
);

export default GameLeaderboardTable;
