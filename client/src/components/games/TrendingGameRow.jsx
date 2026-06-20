import { Link } from "react-router-dom";

const TrendingGameRow = ({ item }) => {
  const game = item.game || item;

  return (
    <Link to={`/games/${game.slug}`} className="flex items-center gap-3 rounded-[10px] border border-[#2f2f36] bg-[#202024] p-3 transition hover:bg-[#28282d]">
      <div className="h-16 w-12 shrink-0 overflow-hidden rounded-md bg-[#18181c]">
        {game.posterUrl ? <img src={game.posterUrl} alt={game.title} className="h-full w-full object-cover" /> : null}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-bold text-white">{game.title}</div>
        <div className="text-sm text-zinc-400">{game.category}</div>
      </div>
      <div className="text-right text-sm text-zinc-300">
        <div className="font-bold text-white">{item.activeRooms || game.activeRooms || 0}</div>
        <div>rooms</div>
      </div>
    </Link>
  );
};

export default TrendingGameRow;
