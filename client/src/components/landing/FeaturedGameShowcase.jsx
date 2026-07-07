import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { featuredGames, squadQueues } from "../../data/landingShowcase";
import LandingPoster from "./LandingPoster";

const tabs = ["Discover", "Ranked", "Co-op", "Cafe Picks"];

const FeaturedGameShowcase = () => {
  const [activeTab, setActiveTab] = useState("Discover");
  const [activeIndex, setActiveIndex] = useState(0);
  const activeGame = featuredGames[activeIndex];
  const filteredQueues = useMemo(() => {
    if (activeTab === "Ranked") return squadQueues.filter((queue) => queue.rankRange !== "Casual");
    if (activeTab === "Co-op") return squadQueues.filter((queue) => ["Rocket League", "Minecraft"].includes(queue.game));
    if (activeTab === "Cafe Picks") return squadQueues.filter((queue) => ["Valorant", "BGMI", "Fortnite"].includes(queue.game));
    return squadQueues;
  }, [activeTab]);

  return (
    <section className="mx-auto max-w-[1480px] px-4 py-14 sm:px-6 lg:py-20">
      <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="eyebrow mb-3">Discover squads</div>
          <h2 className="text-3xl font-black tracking-tight text-white sm:text-5xl">Pick a game. See who is forming up.</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-full px-4 py-2 text-sm font-black transition ${
                activeTab === tab ? "bg-white text-black" : "bg-white/[0.06] text-zinc-300 hover:bg-white/[0.1]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6 max-w-xl rounded-full border border-white/10 bg-white/[0.055] px-5 py-3 text-sm font-semibold text-zinc-400">
        Search games, squads, roles...
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="relative min-h-[420px] overflow-hidden rounded-[28px] border border-white/10 bg-[#1d1d22]">
          <LandingPoster game={activeGame} className="absolute inset-0" imageClassName="opacity-80">
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-black/10" />
            <div className="relative z-10 flex min-h-[420px] max-w-xl flex-col justify-end p-6 sm:p-8">
              <div className="w-max rounded-full bg-white/[0.12] px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-white">
                {activeGame.genre}
              </div>
              <h3 className="mt-5 text-4xl font-black text-white sm:text-6xl">{activeGame.title}</h3>
              <p className="mt-4 text-lg leading-7 text-zinc-200">{activeGame.squadLine}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <span className="rounded-full bg-black/[0.55] px-4 py-2 text-sm font-bold text-white">{activeGame.roleNeeded} role trending</span>
                <span className="rounded-full bg-black/[0.55] px-4 py-2 text-sm font-bold text-white">{activeGame.onlineCount} online</span>
                <span className="rounded-full bg-white px-4 py-2 text-sm font-black text-black">{activeGame.fitScore}% squad fit</span>
              </div>
              <Link to={`/games/${activeGame.slug}`} className="btn-primary mt-7 w-max rounded-xl px-6 py-3">
                Find squad
              </Link>
            </div>
          </LandingPoster>
        </div>

        <div className="grid gap-3">
          {featuredGames.map((game, index) => (
            <button
              key={game.title}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`rounded-3xl border p-3 text-left transition ${
                activeIndex === index ? "border-white/30 bg-white/[0.12]" : "border-white/10 bg-white/[0.04] hover:bg-white/[0.07]"
              }`}
            >
              <div className="flex items-center gap-4">
                <LandingPoster game={game} className="h-20 w-16 shrink-0 rounded-2xl" />
                <div>
                  <div className="text-lg font-black text-white">{game.title}</div>
                  <div className="mt-1 text-sm text-zinc-400">{game.roleNeeded} needed</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-10">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h3 className="text-2xl font-black text-white">Popular squad queues</h3>
          <Link to="/lobbies" className="text-sm font-black text-clutch-blue hover:text-sky-200">
            View all lobbies
          </Link>
        </div>
        <div className="landing-scrollbar-none flex snap-x gap-4 overflow-x-auto pb-2">
          {filteredQueues.map((queue) => (
            <Link
              key={`${queue.game}-${queue.title}`}
              to={`/games/${queue.slug}`}
              className="group min-w-[260px] snap-start overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.045] transition hover:-translate-y-1 hover:bg-white/[0.08]"
            >
              <LandingPoster game={{ title: queue.game, image: queue.image }} className="h-40 rounded-b-none" />
              <div className="space-y-3 p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-black text-white">{queue.game}</div>
                  <span className="rounded-full bg-emerald-400/[0.15] px-3 py-1 text-xs font-black text-emerald-200">{queue.fitScore}%</span>
                </div>
                <div className="text-sm text-zinc-300">{queue.title}</div>
                <div className="text-xs font-bold uppercase tracking-[0.12em] text-zinc-500">{queue.roleNeeded} - {queue.rankRange}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedGameShowcase;
