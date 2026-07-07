import { Link } from "react-router-dom";
import { discoveryRows, squadQueues } from "../../data/landingShowcase";
import { getGameArt, slugifyGame } from "../../utils/gameArt";
import LandingPoster from "./LandingPoster";

const queueForGame = (gameName) => squadQueues.find((queue) => queue.game === gameName);

const roleFallbacks = ["Flex", "Support", "IGL", "Entry", "Anchor"];

const getLobbyCount = (gameName) => {
  const queue = queueForGame(gameName);
  return queue?.onlineCount ? Math.max(3, Math.round(queue.onlineCount / 4)) : 7 + (gameName.length % 8);
};

const getRole = (gameName) => {
  const queue = queueForGame(gameName);
  return queue?.roleNeeded || roleFallbacks[gameName.length % roleFallbacks.length];
};

const cleanRowLabel = (label) => label.replace(" squad games", "").replace(" games", "");

const DiscoveryCard = ({ gameName, rowLabel, duplicate = false }) => {
  const slug = slugifyGame(gameName);
  const openLobbies = getLobbyCount(gameName);
  const role = getRole(gameName);

  return (
    <Link
      to={`/games/${slug}`}
      tabIndex={duplicate ? -1 : undefined}
      className="group block w-[188px] shrink-0 sm:w-[210px] lg:w-[226px]"
    >
      <div className="relative h-full overflow-hidden rounded-[30px] border border-white/10 bg-[#202024] transition duration-300 group-hover:-translate-y-1 group-hover:border-white/20 group-hover:bg-[#25252a]">
        <LandingPoster
          game={{ title: gameName, image: getGameArt(gameName) }}
          className="h-52 rounded-b-none sm:h-56 lg:h-60"
          imageClassName="transition duration-500 group-hover:scale-[1.04]"
        >
          <div className="absolute inset-x-3 bottom-3 translate-y-2 rounded-full bg-black/70 px-3 py-2 text-center text-sm font-black text-white opacity-0 transition duration-200 group-hover:translate-y-0 group-hover:opacity-100">
            Find squad
          </div>
        </LandingPoster>
        <div className="space-y-3 p-4">
          <div>
            <div className="line-clamp-1 text-lg font-black leading-tight text-white">{gameName}</div>
            <div className="mt-2 text-sm text-zinc-400">{cleanRowLabel(rowLabel)}</div>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-black text-zinc-200">
            <span className="rounded-full bg-white/[0.075] px-3 py-1">{openLobbies} lobbies</span>
            <span className="rounded-full bg-white/[0.075] px-3 py-1">{role}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

const GameDiscoveryRail = () => (
  <section className="mx-auto max-w-[1500px] px-4 py-10 sm:px-6 lg:py-14">
    <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="eyebrow mb-3">Game discovery</div>
        <h2 className="text-3xl font-black tracking-tight text-white sm:text-5xl">Browse games like you are choosing tonight's queue.</h2>
      </div>
      <Link to="/games" className="btn-secondary w-max rounded-xl px-5 py-3">
        Browse all games
      </Link>
    </div>

    <div className="rounded-[36px] border border-white/10 bg-[#17171b] px-4 py-5 sm:px-5 lg:px-6">
      <div className="space-y-7">
        {discoveryRows.map((row, rowIndex) => (
          <div key={row.label}>
            <div className="mb-4 flex items-center justify-between gap-4">
              <h3 className="text-2xl font-black text-white">{row.label}</h3>
              <span className="hidden rounded-full bg-white/[0.06] px-3 py-1 text-xs font-black uppercase tracking-[0.22em] text-zinc-400 sm:inline-flex">
                Live queues
              </span>
            </div>
            <div className="landing-marquee">
              <div
                className={`landing-marquee-track ${rowIndex % 2 === 1 ? "landing-marquee-track-right" : ""}`}
                style={{ "--landing-marquee-duration": `${42 + rowIndex * 5}s` }}
              >
                {[0, 1].map((copyIndex) => (
                  <div
                    key={`${row.label}-copy-${copyIndex}`}
                    className="landing-marquee-group"
                    aria-hidden={copyIndex === 1}
                  >
                    {row.games.map((gameName) => (
                      <DiscoveryCard
                        key={`${row.label}-${copyIndex}-${gameName}`}
                        gameName={gameName}
                        rowLabel={row.label}
                        duplicate={copyIndex === 1}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default GameDiscoveryRail;
