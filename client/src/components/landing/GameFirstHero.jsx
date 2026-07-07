import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { featuredGames } from "../../data/landingShowcase";
import LandingPoster from "./LandingPoster";

const badges = ["Steam-ready profiles", "Discord voice rooms", "Gameplay Graph", "Scorecard analysis"];

const GameFirstHero = () => {
  const { user } = useAuth();
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const activeGame = featuredGames[activeIndex];

  useEffect(() => {
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (paused || reducedMotion) return undefined;

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % featuredGames.length);
    }, 4000);

    return () => window.clearInterval(timer);
  }, [paused]);

  return (
    <section className="relative overflow-hidden border-b border-white/10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_16%,rgba(53,184,255,0.16),transparent_32%),radial-gradient(circle_at_14%_18%,rgba(255,255,255,0.08),transparent_26%)]" />
      <div className="relative mx-auto grid max-w-[1480px] gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:py-20">
        <div className="flex flex-col justify-center">
          <div className="eyebrow mb-5">ClutchQ squad finder</div>
          <h1 className="max-w-3xl text-5xl font-black leading-[0.95] tracking-tight text-white sm:text-6xl xl:text-7xl">
            Stop queueing with randoms.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-zinc-300 sm:text-lg">
            ClutchQ helps gamers find reliable teammates by game, rank, role, region, availability, voice preference, trust, and recent activity before anyone commits to a lobby.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to={user ? "/dashboard" : "/register"} className="btn-primary rounded-xl px-6 py-3 text-base">
              Find Teammates
            </Link>
            <Link to="/games" className="btn-secondary rounded-xl px-6 py-3 text-base">
              Explore Games
            </Link>
            <Link to="/login" className="btn-secondary rounded-xl px-6 py-3 text-base">
              Try Demo Squad
            </Link>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {["50+ seeded players", "Steam profiles", "Discord voice", "Gameplay Graph"].map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm font-bold text-zinc-200">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div
          className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_190px]"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="relative min-h-[520px] overflow-hidden rounded-[28px] border border-white/10 bg-[#1d1d22] shadow-2xl shadow-black/30">
            <LandingPoster
              key={activeGame.title}
              game={activeGame}
              className="absolute inset-0"
              imageClassName="scale-[1.02] transition duration-500"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/[0.35] to-transparent" />
              <div className="absolute left-5 right-5 top-5 flex items-center justify-between gap-3">
                <div className="rounded-full border border-white/[0.15] bg-black/50 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-white">
                  Featured squad
                </div>
                <div className="rounded-full bg-white px-4 py-2 text-sm font-black text-black">{activeGame.fitScore}% fit</div>
              </div>
              <div className="absolute inset-x-5 bottom-5">
                <div className="max-w-xl">
                  <div className="text-sm font-bold uppercase tracking-[0.18em] text-zinc-300">{activeGame.genre}</div>
                  <h2 className="mt-2 text-4xl font-black text-white sm:text-5xl">{activeGame.title}</h2>
                  <p className="mt-3 max-w-md text-base leading-6 text-zinc-200">{activeGame.squadLine}</p>
                </div>
                <div className="mt-5 grid gap-3 rounded-3xl border border-white/10 bg-black/[0.62] p-4 backdrop-blur sm:grid-cols-3">
                  <div>
                    <div className="text-xs uppercase tracking-[0.14em] text-zinc-400">Need</div>
                    <div className="mt-1 font-black text-white">{activeGame.roleNeeded}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-[0.14em] text-zinc-400">Rank</div>
                    <div className="mt-1 font-black text-white">{activeGame.rankRange}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-[0.14em] text-zinc-400">Voice</div>
                    <div className="mt-1 font-black text-white">Ready</div>
                  </div>
                </div>
              </div>
            </LandingPoster>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-1 lg:block lg:space-y-3 lg:overflow-visible">
            {featuredGames.slice(0, 5).map((game, index) => (
              <button
                key={game.title}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`min-w-52 rounded-3xl border p-3 text-left transition duration-200 lg:min-w-0 ${
                  index === activeIndex ? "border-white/30 bg-white/[0.12]" : "border-white/10 bg-white/[0.035] hover:bg-white/[0.07]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <LandingPoster game={game} className="h-16 w-12 shrink-0 rounded-2xl" />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-black text-white">{game.title}</div>
                    <div className="mt-1 text-xs text-zinc-400">{game.onlineCount} online</div>
                    <div className="mt-2 h-1.5 rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-clutch-blue" style={{ width: `${game.fitScore}%` }} />
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
        <div className="lg:col-span-2 flex flex-wrap gap-2 text-xs font-bold uppercase tracking-[0.14em] text-zinc-400">
          {badges.map((badge) => (
            <span key={badge} className="rounded-full border border-white/10 px-3 py-2">
              {badge}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};

export default GameFirstHero;
