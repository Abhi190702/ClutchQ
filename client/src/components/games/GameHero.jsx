import { Link } from "react-router-dom";

const GameHero = ({ game, onFindSquad, onCreateRoom, finding }) => (
  <section className="relative overflow-hidden rounded-[10px] border border-[#2f2f36] bg-[#202024]">
    <div className="absolute inset-0 opacity-35">
      {game.coverUrl ? <img src={game.coverUrl} alt="" className="h-full w-full object-cover" /> : null}
      <div className="absolute inset-0 bg-gradient-to-r from-[#121216] via-[#121216]/85 to-[#121216]/50" />
    </div>
    <div className="relative grid gap-6 p-5 md:grid-cols-[180px_1fr] md:p-8">
      <div className="aspect-[3/4] overflow-hidden rounded-[10px] bg-[#18181c]">
        {game.posterUrl ? <img src={game.posterUrl} alt={game.title} className="h-full w-full object-cover" /> : null}
      </div>
      <div className="flex min-w-0 flex-col justify-end">
        <div className="mb-3 text-sm font-semibold text-zinc-300">{game.category}</div>
        <h1 className="text-4xl font-black tracking-tight text-white md:text-6xl">{game.title}</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-300">{game.description}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {game.genres?.map((genre) => (
            <span key={genre} className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-bold text-zinc-100">
              {genre}
            </span>
          ))}
        </div>
        <div className="mt-6 grid gap-3 text-sm text-zinc-300 sm:grid-cols-3">
          <div>
            <div className="text-2xl font-black text-white">{game.activeRooms || 0}</div>
            <div>active rooms</div>
          </div>
          <div>
            <div className="text-2xl font-black text-white">{game.activePlayers || 0}</div>
            <div>players online</div>
          </div>
          <div>
            <div className="text-2xl font-black text-white">{game.avgWaitMinutes || 5}m</div>
            <div>average wait</div>
          </div>
        </div>
        <div className="mt-7 flex flex-wrap gap-3">
          <button type="button" className="btn-primary" onClick={onFindSquad} disabled={finding}>
            {finding ? "Finding..." : "Find Squad Now"}
          </button>
          <button type="button" className="btn-secondary" onClick={onCreateRoom}>
            Create Room
          </button>
          <Link to={`/games/${game.slug}/rooms`} className="btn-secondary">
            View All Rooms
          </Link>
        </div>
      </div>
    </div>
  </section>
);

export default GameHero;
