import { Link } from "react-router-dom";
import { discoveryRows, squadQueues } from "../../data/landingShowcase";
import { getGameArt, slugifyGame } from "../../utils/gameArt";
import LandingPoster from "./LandingPoster";

const queueForGame = (gameName) => squadQueues.find((queue) => queue.game === gameName);

const GameDiscoveryRail = () => (
  <section className="mx-auto max-w-[1480px] px-4 py-12 sm:px-6 lg:py-16">
    <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="eyebrow mb-3">Game discovery</div>
        <h2 className="text-3xl font-black tracking-tight text-white sm:text-5xl">Browse games like you are choosing tonight's queue.</h2>
      </div>
      <Link to="/games" className="btn-secondary w-max rounded-xl px-5 py-3">
        Browse all games
      </Link>
    </div>

    <div className="space-y-10">
      {discoveryRows.map((row) => (
        <div key={row.label}>
          <h3 className="mb-4 text-2xl font-black text-white">{row.label}</h3>
          <div className="landing-scrollbar-none flex snap-x gap-4 overflow-x-auto pb-2">
            {row.games.map((gameName) => {
              const queue = queueForGame(gameName);
              const slug = slugifyGame(gameName);
              const openLobbies = queue?.onlineCount ? Math.max(3, Math.round(queue.onlineCount / 4)) : 7 + (gameName.length % 8);
              const role = queue?.roleNeeded || ["Flex", "Support", "IGL", "Entry"][gameName.length % 4];

              return (
                <Link
                  key={`${row.label}-${gameName}`}
                  to={`/games/${slug}`}
                  className="group min-w-[190px] snap-start sm:min-w-[220px]"
                >
                  <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.045] transition duration-200 group-hover:-translate-y-1 group-hover:bg-white/[0.075]">
                    <LandingPoster
                      game={{ title: gameName, image: getGameArt(gameName) }}
                      className="aspect-[3/4] rounded-b-none"
                      imageClassName="transition duration-300 group-hover:scale-[1.03]"
                    >
                      <div className="absolute inset-x-3 bottom-3 translate-y-2 rounded-2xl bg-black/75 px-3 py-2 text-center text-sm font-black text-white opacity-0 transition duration-200 group-hover:translate-y-0 group-hover:opacity-100">
                        Find squad
                      </div>
                    </LandingPoster>
                    <div className="space-y-2 p-4">
                      <div className="text-lg font-black text-white">{gameName}</div>
                      <div className="text-sm text-zinc-400">{row.label.replace(" squad games", "")}</div>
                      <div className="flex flex-wrap gap-2 text-xs font-black text-zinc-200">
                        <span className="rounded-full bg-white/[0.075] px-3 py-1">{openLobbies} lobbies</span>
                        <span className="rounded-full bg-white/[0.075] px-3 py-1">{role}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  </section>
);

export default GameDiscoveryRail;
