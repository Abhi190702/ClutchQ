import { Link } from "react-router-dom";

const GameImageFallback = ({ game }) => (
  <div
    className="grid h-full w-full place-items-center"
    style={{
      background: `linear-gradient(135deg, ${game.accentColor || "#3a3a42"}, #18181c 58%, #0f0f12)`
    }}
  >
    <div className="px-4 text-center text-3xl font-black uppercase tracking-tight text-white/90">{game.title?.slice(0, 2) || "CQ"}</div>
  </div>
);

const GameCard = ({ game }) => (
  <Link to={`/games/${game.slug}`} className="group block">
    <div className="overflow-hidden rounded-[10px] bg-[#202024] transition duration-200 group-hover:-translate-y-1 group-hover:bg-[#28282d]">
      <div className="relative aspect-[3/4] overflow-hidden rounded-[10px] bg-[#17171a]">
        {game.posterUrl ? (
          <img
            src={game.posterUrl}
            alt={game.title}
            loading="lazy"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.035]"
            onError={(event) => {
              event.currentTarget.style.display = "none";
              event.currentTarget.nextElementSibling?.classList.remove("hidden");
            }}
          />
        ) : null}
        <div className={game.posterUrl ? "hidden h-full" : "h-full"}>
          <GameImageFallback game={game} />
        </div>
        <div className="pointer-events-none absolute inset-x-3 bottom-3 translate-y-2 rounded-md bg-black/70 px-3 py-2 text-center text-sm font-bold opacity-0 transition duration-200 group-hover:translate-y-0 group-hover:opacity-100">
          View Rooms
        </div>
      </div>
    </div>
    <div className="mt-3 space-y-1">
      <div className="text-sm text-zinc-400">{game.category || "Game Room"}</div>
      <div className="text-base font-bold text-white">{game.title}</div>
      <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-300">
        <span className="rounded bg-[#2b2b31] px-2 py-1 text-xs font-bold text-white">{game.status || "Active"}</span>
        <span>{game.activeRooms || 0} rooms</span>
        <span className="text-zinc-600">/</span>
        <span>{game.activePlayers || 0} online</span>
      </div>
    </div>
  </Link>
);

export default GameCard;
