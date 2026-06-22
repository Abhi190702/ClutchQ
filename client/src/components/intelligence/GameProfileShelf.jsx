import { formatHours, formatRating } from "../../utils/formatters";
import { getGameArt } from "../../utils/gameArt";

const GameProfileShelf = ({ games = [] }) => {
  if (!games.length) {
    return <p className="text-sm leading-6 text-zinc-400">Game profiles build from Steam, sessions, and scorecards.</p>;
  }

  return (
    <div className="grid gap-3 md:grid-cols-3">
      {games.slice(0, 3).map((game) => {
        const art = getGameArt(game.gameName || game.gameSlug);
        return (
          <article key={game.gameSlug || game.gameName} className="overflow-hidden rounded-[10px] border border-white/10 bg-white/[0.025]">
            <div className="h-28 bg-white/[0.04]">
              {art ? <img src={art} alt="" className="h-full w-full object-cover" loading="lazy" /> : null}
            </div>
            <div className="p-4">
              <div className="truncate text-base font-black text-white">{game.gameName}</div>
              <div className="mt-1 text-sm text-zinc-400">{formatHours(game.minutes)} · {game.sessions || 0} sessions</div>
              <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                <span className="font-bold text-zinc-400">{game.roleSignal || "Flex"}</span>
                <span className="font-black text-white">{formatRating(game.averageRating)}</span>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
};

export default GameProfileShelf;
