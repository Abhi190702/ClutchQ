import { useEffect, useState } from "react";
import PageShell from "../components/common/PageShell";
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

  useEffect(() => {
    const load = async () => {
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
        showToast(getErrorMessage(error), "error");
      }
    };
    load();
  }, [range, showToast]);

  return (
    <PageShell fullWidth>
      <div className="mx-auto max-w-[1480px] space-y-8 px-1 py-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-white">Leaderboards</h1>
            <p className="mt-3 max-w-2xl text-zinc-400">Most played games, active players, trending rooms, and trust-heavy teammate rankings.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {ranges.map((item) => (
              <button key={item.id} type="button" className={`rounded-full px-4 py-2 text-sm font-bold ${range === item.id ? "bg-white text-black" : "bg-[#202024] text-zinc-300"}`} onClick={() => setRange(item.id)}>
                {item.label}
              </button>
            ))}
          </div>
        </div>
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
