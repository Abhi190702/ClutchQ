import { useEffect, useMemo, useState } from "react";
import PageShell from "../components/common/PageShell";
import GameFilters from "../components/games/GameFilters";
import GameGenreRail from "../components/games/GameGenreRail";
import GamePosterGrid from "../components/games/GamePosterGrid";
import GameSkeletonGrid from "../components/games/GameSkeletonGrid";
import { useToast } from "../context/ToastContext";
import gameApi from "../services/gameApi";
import { getErrorMessage } from "../services/api";
import { gameGenres } from "../data/gameCatalog";

const tabs = ["Discover", "Browse", "Trending", "My Games"];

const Games = () => {
  const { showToast } = useToast();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("Browse");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const response = await gameApi.list({ ...filters, search });
        setGames(response.data.data);
      } catch (error) {
        showToast(getErrorMessage(error), "error");
      } finally {
        setLoading(false);
      }
    };

    const id = window.setTimeout(load, 250);
    return () => window.clearTimeout(id);
  }, [filters, search, showToast]);

  const visibleGames = useMemo(() => {
    if (activeTab === "Trending") return [...games].sort((a, b) => (b.activeRooms || 0) - (a.activeRooms || 0));
    if (activeTab === "My Games") return games.filter((game) => ["valorant", "fortnite", "chained-together", "among-us"].includes(game.slug));
    return games;
  }, [activeTab, games]);

  return (
    <PageShell fullWidth>
      <div className="mx-auto max-w-[1480px] space-y-10 px-1 py-4">
        <div className="grid gap-5 xl:grid-cols-[1fr_260px]">
          <div className="space-y-7">
            <div>
              <h1 className="text-4xl font-black tracking-tight text-white md:text-5xl">Browse Game Rooms</h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-zinc-400">Pick a game, find active squads, and join a live party before you queue.</p>
            </div>

            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
              <div className="relative max-w-xl flex-1">
                <input
                  className="w-full rounded-full border border-transparent bg-[#202024] px-5 py-3 text-sm text-white outline-none transition focus:border-[#3a3a42]"
                  placeholder="Search games"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    className={`rounded-full px-4 py-2 text-sm font-bold transition ${activeTab === tab ? "bg-white text-black" : "text-zinc-400 hover:text-white"}`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <GameGenreRail genres={gameGenres} activeGenre={filters.genre} onSelect={(genre) => setFilters({ ...filters, genre })} />
          </div>

          <div className="xl:pt-28">
            <GameFilters filters={filters} onChange={setFilters} />
          </div>
        </div>

        <section className="space-y-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-white">All Games</h2>
              <p className="mt-1 text-sm text-zinc-400">No prices, no clutter. Just active rooms, players, and queue fit.</p>
            </div>
            <div className="hidden text-sm text-zinc-400 sm:block">{visibleGames.length} games</div>
          </div>
          {loading ? <GameSkeletonGrid /> : <GamePosterGrid games={visibleGames} />}
        </section>
      </div>
    </PageShell>
  );
};

export default Games;
