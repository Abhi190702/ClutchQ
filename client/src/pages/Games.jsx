import { useEffect, useMemo, useState } from "react";
import PageShell from "../components/common/PageShell";
import GameFilters from "../components/games/GameFilters";
import ErrorState from "../components/common/ErrorState";
import GamePosterGrid from "../components/games/GamePosterGrid";
import GameSkeletonGrid from "../components/games/GameSkeletonGrid";
import { useToast } from "../context/ToastContext";
import gameApi from "../services/gameApi";
import { getErrorMessage } from "../services/api";

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
      <div className="mx-auto max-w-[1540px] space-y-12 px-1 py-1">
        <section className="page-intro space-y-8">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="eyebrow mb-3">Game library</div>
              <h1 className="page-title">Find your next game.</h1>
              <p className="page-description">Browse active communities, inspect open rooms, and join a squad before you queue.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={`rounded-full px-5 py-2.5 text-sm font-bold transition ${activeTab === tab ? "bg-white text-black shadow-[0_10px_28px_rgba(0,0,0,0.2)]" : "text-zinc-400 hover:bg-white/[0.06] hover:text-white"}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="max-w-4xl">
            <input
              className="w-full rounded-[20px] border border-white/10 bg-black/20 px-6 py-4 text-base text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.035)] outline-none transition placeholder:text-zinc-600 hover:border-white/[0.16] focus:border-clutch-blue/50"
              placeholder="Search games"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

        </section>

        <GameFilters filters={filters} onChange={setFilters} />

        <section className="space-y-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-black tracking-[-0.04em] text-white md:text-4xl">All Games</h2>
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
