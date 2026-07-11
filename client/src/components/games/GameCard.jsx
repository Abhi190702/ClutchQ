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
    <div className="overflow-hidden rounded-[24px] bg-[#14161c] shadow-[0_20px_60px_rgba(0,0,0,0.24)] ring-1 ring-white/[0.08] transition duration-300 group-hover:-translate-y-1.5 group-hover:shadow-[0_30px_90px_rgba(0,0,0,0.38)] group-hover:ring-white/[0.16]">
      <div className="relative aspect-[3/4] overflow-hidden rounded-[24px] bg-[#111218]">
        {game.posterUrl ? (
          <img
            src={game.posterUrl}
            alt={game.title}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.045]"
            onError={(event) => {
              event.currentTarget.style.display = "none";
              event.currentTarget.nextElementSibling?.classList.remove("hidden");
            }}
          />
        ) : null}
        <div className={game.posterUrl ? "hidden h-full" : "h-full"}>
          <GameImageFallback game={game} />
        </div>
        <div className="pointer-events-none absolute inset-x-4 bottom-4 translate-y-2 rounded-[14px] border border-white/10 bg-black/65 px-3 py-2.5 text-center text-sm font-bold opacity-0 backdrop-blur-xl transition duration-200 group-hover:translate-y-0 group-hover:opacity-100">
          View Rooms
        </div>
      </div>
    </div>
    <div className="mt-4 space-y-1.5 px-1">
      <div className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">{game.category || "Game Room"}</div>
      <div className="text-lg font-black tracking-[-0.02em] text-white">{game.title}</div>
      <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-300">
        <span className="text-xs font-black text-clutch-blue">{game.status || "Active"}</span>
        <span>{game.activeRooms || 0} rooms</span>
        <span className="text-zinc-600">/</span>
        <span>{game.activePlayers || 0} online</span>
      </div>
    </div>
  </Link>
);

export default GameCard;
