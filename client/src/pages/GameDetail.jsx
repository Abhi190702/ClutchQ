import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageShell from "../components/common/PageShell";
import ActiveRoomsPanel from "../components/games/ActiveRoomsPanel";
import GameEmptyState from "../components/games/GameEmptyState";
import GameHero from "../components/games/GameHero";
import GameStatsStrip from "../components/games/GameStatsStrip";
import StartPlayingPanel from "../components/activity/StartPlayingPanel";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import gameApi from "../services/gameApi";
import { getErrorMessage } from "../services/api";
import { formatHours, formatPercentage, safeNumber } from "../utils/formatters";

const GameDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [game, setGame] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [stats, setStats] = useState(null);
  const [topPlayers, setTopPlayers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [finding, setFinding] = useState(false);

  const load = async () => {
    try {
      const [gameResponse, roomsResponse, statsResponse, playersResponse] = await Promise.all([
        gameApi.get(slug),
        gameApi.rooms(slug),
        gameApi.stats(slug),
        gameApi.topPlayers(slug)
      ]);
      setGame(gameResponse.data.data);
      setRooms(roomsResponse.data.data);
      setStats(statsResponse.data.data);
      setTopPlayers(playersResponse.data.data);
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    }
  };

  useEffect(() => {
    load();
  }, [slug]);

  const findSquad = async () => {
    setFinding(true);
    try {
      const response = await gameApi.findSquad(slug);
      setMatches(response.data.data);
      showToast(response.data.message, response.data.data.length ? "success" : "info");
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      setFinding(false);
    }
  };

  if (!game) {
    return (
      <PageShell fullWidth>
        <div className="mx-auto max-w-[1480px] py-8">
          <GameEmptyState title="Loading game" description="Preparing game rooms and stats." />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell fullWidth>
      <div className="mx-auto max-w-[1480px] space-y-8 px-1 py-4">
        <GameHero game={game} onFindSquad={findSquad} onCreateRoom={() => navigate(`/games/${slug}/rooms`)} finding={finding} />
        <GameStatsStrip game={game} stats={stats} />

        {matches.length ? (
          <section className="space-y-4">
            <h2 className="text-2xl font-black text-white">Best Matches For You</h2>
            <div className="grid gap-3">
              {matches.map((match) => (
                <div key={match.room._id} className="rounded-[10px] border border-sky-400/30 bg-[#202024] p-4">
                  <div className="font-bold text-white">{match.room.title}</div>
                  <div className="mt-1 text-sm text-zinc-400">Compatibility score {match.score}</div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <div className="space-y-8">
            <ActiveRoomsPanel rooms={rooms} user={user} onUpdated={load} limit={5} />
            <section className="space-y-4">
              <h2 className="text-2xl font-black text-white">Game Roles</h2>
              <div className="flex flex-wrap gap-2">
                {game.roles?.map((role) => (
                  <span key={role} className="rounded-full border border-[#33333a] bg-[#202024] px-3 py-2 text-sm font-bold text-zinc-200">
                    {role}
                  </span>
                ))}
              </div>
            </section>
          </div>
          <aside className="space-y-6">
            <StartPlayingPanel games={[game]} selectedGameSlug={game.slug} onStarted={() => navigate("/activity")} />
            <div className="rounded-[10px] border border-[#2f2f36] bg-[#202024] p-5">
              <h3 className="text-lg font-black text-white">Top Players</h3>
              <div className="mt-4 grid gap-3">
                {topPlayers.slice(0, 6).map((row) => (
                  <div key={row.user?._id || row.playtime?._id} className="rounded-md border border-[#33333a] bg-[#18181c] p-3">
                    <div className="font-bold text-white">{row.user?.name || "Player"}</div>
                    <div className="text-sm text-zinc-400">
                      {Number.isNaN(safeNumber(row.profile?.trustScore, NaN)) ? "No trust data" : `Trust ${formatPercentage(row.profile.trustScore)}`} - {formatHours(row.playtime?.totalMinutes)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </PageShell>
  );
};

export default GameDetail;
