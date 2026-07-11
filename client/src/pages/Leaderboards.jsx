import { useCallback, useEffect, useState } from "react";
import PageShell from "../components/common/PageShell";
import ErrorState from "../components/common/ErrorState";
import GameLeaderboardTable from "../components/leaderboards/GameLeaderboardTable";
import TopPlayersTable from "../components/leaderboards/TopPlayersTable";
import TrendingGamesPanel from "../components/leaderboards/TrendingGamesPanel";
import { useToast } from "../context/ToastContext";
import leaderboardApi from "../services/leaderboardApi";
import { getErrorMessage } from "../services/api";

const ranges = [
  { id: "week", label: "This Week" },
  { id: "month", label: "This Month" },
  { id: "all", label: "All Time" }
];

const Leaderboards = () => {
  const { showToast } = useToast();
  const [range, setRange] = useState("week");
  const [games, setGames] = useState([]);
  const [players, setPlayers] = useState([]);
  const [trending, setTrending] = useState([]);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const [gamesResponse, playersResponse, trendingResponse] = await Promise.all([
        leaderboardApi.games({ range }),
        leaderboardApi.players({ range }),
        leaderboardApi.trendingGames()
      ]);
      setGames(gamesResponse.data.data);
      setPlayers(playersResponse.data.data);
      setTrending(trendingResponse.data.data);
    } catch (error) {
      const message = getErrorMessage(error);
      setError(message);
      showToast(message, "error");
    }
  }, [range, showToast]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <PageShell fullWidth>
      <div className="mx-auto max-w-[1540px] space-y-10 px-1 py-1">
        <div className="page-intro flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="eyebrow mb-3">Competitive pulse</div>
            <h1 className="page-title">Leaderboards</h1>
            <p className="page-description">Most played games, active players, trending rooms, and trust-heavy teammate rankings.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {ranges.map((item) => (
              <button key={item.id} type="button" className={`rounded-full px-4 py-2.5 text-sm font-bold transition ${range === item.id ? "bg-white text-black" : "bg-black/20 text-zinc-400 hover:bg-white/[0.06] hover:text-white"}`} onClick={() => setRange(item.id)}>
                {item.label}
              </button>
            ))}
          </div>
        </div>
        {error ? <ErrorState message={error} onRetry={load} /> : null}
        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <GameLeaderboardTable rows={games} />
            <TopPlayersTable rows={players} />
          </div>
          <TrendingGamesPanel rows={trending} />
        </div>
      </div>
    </PageShell>
  );
};

export default Leaderboards;
