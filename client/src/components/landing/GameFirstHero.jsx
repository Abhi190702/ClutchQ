import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { featuredGames } from "../../data/landingShowcase";
import LandingPoster from "./LandingPoster";

const proofItems = [
  { value: "50+", label: "seeded players" },
  { value: "Steam", label: "verified profiles" },
  { value: "Discord", label: "voice rooms" },
  { value: "Graph", label: "activity history" }
];

const badges = ["Steam-ready profiles", "Discord voice rooms", "Gameplay Graph", "Scorecard analysis"];

const posterCropClass = (title) => {
  if (title === "Minecraft") return "object-top scale-[1.08]";
  if (title === "Fortnite") return "object-center scale-[1.03]";
  return "object-center scale-[1.04]";
};

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
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_16%,rgba(53,184,255,0.12),transparent_32%),radial-gradient(circle_at_14%_18%,rgba(255,255,255,0.06),transparent_26%)]" />
      <div className="relative mx-auto grid max-w-[1480px] gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:py-16 xl:gap-12">
        <div className="flex flex-col justify-center">
          <div className="eyebrow mb-5">ClutchQ squad finder</div>
          <h1 className="max-w-3xl text-5xl font-black leading-[0.95] tracking-tight text-white sm:text-6xl xl:text-[5.4rem]">
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
          <div className="mt-10 flex flex-wrap gap-x-8 gap-y-5">
            {proofItems.map((item) => (
              <div key={item.label} className="min-w-[118px]">
                <div className="text-2xl font-black leading-none text-white">{item.value}</div>
                <div className="mt-2 text-[0.68rem] font-black uppercase tracking-[0.18em] text-zinc-500">{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div
          className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_180px] xl:grid-cols-[minmax(0,1fr)_200px]"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="relative min-h-[520px] overflow-hidden rounded-[36px] bg-[#1d1d22] shadow-2xl shadow-black/30 ring-1 ring-white/10">
            <LandingPoster
              key={activeGame.title}
              game={activeGame}
              className="absolute inset-0"
              imageClassName={`${posterCropClass(activeGame.title)} transition duration-700`}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/[0.34] to-black/10" />
              <div className="absolute left-5 right-5 top-5 flex items-center justify-between gap-3">
                <div className="rounded-full bg-black/60 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-white">
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
                <div className="mt-6 flex flex-wrap gap-x-10 gap-y-4 border-t border-white/20 pt-5">
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

          <div className="landing-scrollbar-none flex gap-3 overflow-x-auto pb-1 lg:block lg:space-y-3 lg:overflow-visible">
            {featuredGames.slice(0, 5).map((game, index) => (
              <button
                key={game.title}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`relative min-w-52 rounded-[28px] p-3 text-left transition duration-200 lg:min-w-0 ${
                  index === activeIndex ? "bg-white/[0.09]" : "hover:bg-white/[0.045]"
                }`}
              >
                {index === activeIndex ? <span className="absolute bottom-4 left-3 top-4 w-1 rounded-full bg-clutch-blue" /> : null}
                <div className="flex items-center gap-3">
                  <LandingPoster
                    game={game}
                    className="h-16 w-16 shrink-0 rounded-2xl"
                    imageClassName={game.title === "Minecraft" ? "object-top" : "object-center"}
                  />
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
        <div className="flex flex-wrap gap-x-7 gap-y-3 border-t border-white/10 pt-5 text-xs font-black uppercase tracking-[0.16em] text-zinc-500 lg:col-span-2">
          {badges.map((badge) => (
            <span key={badge}>{badge}</span>
          ))}
        </div>
      </div>
    </section>
  );
};

export default GameFirstHero;
