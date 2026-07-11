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
  if (title === "Minecraft") return "object-center scale-[1.42]";
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
    <section className="relative overflow-hidden pb-6 pt-5 sm:pt-8">
      <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(61,187,250,0.055),transparent_38%,rgba(255,255,255,0.018))]" />
      <div className="relative mx-auto grid max-w-[1540px] gap-12 px-4 py-12 sm:px-6 lg:min-h-[760px] lg:grid-cols-[0.88fr_1.12fr] lg:items-center lg:py-16 xl:gap-16">
        <div className="flex flex-col justify-center">
          <div className="eyebrow mb-5">ClutchQ squad finder</div>
          <h1 className="max-w-3xl text-5xl font-black leading-[0.92] tracking-[-0.055em] text-white sm:text-6xl xl:text-[5.4rem]">
            Stop queueing with randoms.
          </h1>
          <p className="mt-7 max-w-2xl text-base leading-8 text-zinc-300 sm:text-xl sm:leading-9">
            ClutchQ helps gamers find reliable teammates by game, rank, role, region, availability, voice preference, trust, and recent activity before anyone commits to a lobby.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link to={user ? "/dashboard" : "/register"} className="btn-primary px-7 py-3.5 text-base">
              Find Teammates
            </Link>
            <Link to="/games" className="btn-secondary px-7 py-3.5 text-base">
              Explore Games
            </Link>
            <Link to="/login" className="btn-secondary px-7 py-3.5 text-base">
              Try Demo Squad
            </Link>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-x-8 gap-y-6 border-t border-white/[0.08] pt-7 sm:grid-cols-4">
            {proofItems.map((item) => (
              <div key={item.label}>
                <div className="text-2xl font-black leading-none tracking-[-0.035em] text-white">{item.value}</div>
                <div className="mt-2 text-[0.64rem] font-black uppercase tracking-[0.18em] text-zinc-500">{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div
          className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_170px] xl:grid-cols-[minmax(0,1fr)_190px]"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="relative min-h-[590px] overflow-hidden rounded-[34px] bg-[#14161c] shadow-[0_40px_120px_rgba(0,0,0,0.48)] ring-1 ring-white/10 xl:min-h-[640px]">
            <LandingPoster
              key={activeGame.title}
              game={activeGame}
              className="absolute inset-0"
              imageClassName={`${posterCropClass(activeGame.title)} transition duration-700`}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/[0.26] to-black/5" />
              <div className="absolute left-6 right-6 top-6 flex items-center justify-between gap-3">
                <div className="rounded-full border border-white/10 bg-black/55 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-white backdrop-blur-xl">
                  Featured squad
                </div>
                <div className="rounded-full bg-white px-4 py-2 text-sm font-black text-black">{activeGame.fitScore}% fit</div>
              </div>
              <div className="absolute inset-x-6 bottom-6">
                <div className="max-w-xl">
                  <div className="text-sm font-bold uppercase tracking-[0.18em] text-zinc-300">{activeGame.genre}</div>
                  <h2 className="mt-2 text-5xl font-black tracking-[-0.045em] text-white sm:text-6xl">{activeGame.title}</h2>
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
                className={`relative min-w-52 rounded-[22px] border p-3 text-left transition duration-200 lg:min-w-0 ${
                  index === activeIndex ? "border-clutch-blue/25 bg-clutch-blue/[0.08]" : "border-transparent hover:border-white/[0.08] hover:bg-white/[0.035]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <LandingPoster
                    game={game}
                    className="h-16 w-16 shrink-0 rounded-2xl"
                    imageClassName={game.title === "Minecraft" ? "object-center scale-[1.18]" : "object-center"}
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
        <div className="flex flex-wrap gap-x-8 gap-y-3 border-t border-white/[0.07] pt-6 text-[0.68rem] font-black uppercase tracking-[0.18em] text-zinc-600 lg:col-span-2">
          {badges.map((badge) => (
            <span key={badge}>{badge}</span>
          ))}
        </div>
      </div>
    </section>
  );
};

export default GameFirstHero;
