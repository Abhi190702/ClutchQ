import { useEffect, useMemo, useState } from "react";
import PageShell from "../components/common/PageShell";
import GameFilters from "../components/games/GameFilters";
import ErrorState from "../components/common/ErrorState";
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
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({});
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("Browse");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await gameApi.list({ ...filters, search });
        setGames(response.data.data);
      } catch (error) {
        const message = getErrorMessage(error);
        setError(message);
        showToast(message, "error");
      } finally {
        setLoading(false);
      }
    };

    const id = window.setTimeout(load, 250);
    return () => window.clearTimeout(id);
  }, [filters, search, showToast, reloadKey]);

  const visibleGames = useMemo(() => {
    if (activeTab === "Trending") return [...games].sort((a, b) => (b.activeRooms || 0) - (a.activeRooms || 0));
    if (activeTab === "My Games") return games.filter((game) => ["valorant", "fortnite", "chained-together", "among-us"].includes(game.slug));
    return games;
  }, [activeTab, games]);

  return (
    <PageShell fullWidth>
      <div className="mx-auto max-w-[1540px] space-y-10 px-1 py-4">
        <section className="space-y-7">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h1 className="text-5xl font-black tracking-tight text-white md:text-6xl">Browse Game Rooms</h1>
              <p className="mt-4 max-w-3xl text-lg leading-8 text-zinc-400">Pick a game, find active squads, and join a live party before you queue.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={`rounded-full px-5 py-2.5 text-sm font-bold transition ${activeTab === tab ? "bg-white text-black" : "text-zinc-400 hover:bg-white/[0.06] hover:text-white"}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="max-w-3xl">
            <input
              className="w-full rounded-full border border-transparent bg-[#202024] px-6 py-4 text-base text-white outline-none transition focus:border-[#3a3a42]"
              placeholder="Search games"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <GameFilters filters={filters} onChange={setFilters} />
          <GameGenreRail genres={gameGenres} activeGenre={filters.genre} onSelect={(genre) => setFilters({ ...filters, genre })} />
        </section>

        <section className="space-y-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-white">All Games</h2>
              <p className="mt-1 text-sm text-zinc-400">No prices, no clutter. Just active rooms, players, and queue fit.</p>
            </div>
            <div className="hidden text-sm text-zinc-400 sm:block">{visibleGames.length} games</div>
          </div>
          {error ? <ErrorState message={error} onRetry={() => setReloadKey((value) => value + 1)} /> : loading ? <GameSkeletonGrid /> : <GamePosterGrid games={visibleGames} />}
        </section>
      </div>
    </PageShell>
  );
};

export default Games;
