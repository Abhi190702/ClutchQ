import TrendingGameRow from "../games/TrendingGameRow";

const TrendingGamesPanel = ({ rows = [] }) => (
  <div className="premium-panel p-5">
    <h3 className="text-lg font-black text-white">Trending Games</h3>
    <div className="mt-4 grid gap-3">
      {rows.length ? rows.map((row) => <TrendingGameRow key={row.game?.slug || row.rank} item={row} />) : <p className="text-sm text-zinc-400">No active rooms yet.</p>}
    </div>
  </div>
);

export default TrendingGamesPanel;
