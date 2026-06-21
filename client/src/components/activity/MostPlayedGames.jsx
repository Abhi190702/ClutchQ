import { formatHours } from "../../utils/formatters";

const MostPlayedGames = ({ aggregates = [] }) => (
  <section className="rounded-[10px] border border-[#2f2f36] bg-[#202024] p-5">
    <h3 className="text-lg font-black text-white">Most Played Games</h3>
    <div className="mt-4 grid gap-3">
      {aggregates.length ? (
        aggregates.slice(0, 8).map((item, index) => (
          <div key={item._id || item.gameSlug} className="flex items-center justify-between rounded-md border border-[#33333a] bg-[#18181c] p-3">
            <div>
              <div className="font-bold text-white">{index + 1}. {item.gameName}</div>
              <div className="text-sm text-zinc-400">{item.sessionsCount || 0} sessions</div>
            </div>
            <div className="text-sm font-bold text-zinc-200">{formatHours(item.totalMinutes)}</div>
          </div>
        ))
      ) : (
        <p className="text-sm text-zinc-400">Play sessions will appear here.</p>
      )}
    </div>
  </section>
);

export default MostPlayedGames;
