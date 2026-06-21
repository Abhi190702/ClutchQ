import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PageShell from "../components/common/PageShell";
import ErrorState from "../components/common/ErrorState";
import StatCard from "../components/common/StatCard";
import FindSquadNow from "../components/dashboard/FindSquadNow";
import LiveDNAVisualizer from "../components/dashboard/LiveDNAVisualizer";
import PlayerFilters from "../components/dashboard/PlayerFilters";
import RecommendedPlayers from "../components/dashboard/RecommendedPlayers";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import api, { getErrorMessage } from "../services/api";
import { getPrimaryGame } from "../utils/rankLogic";

const Dashboard = () => {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ game: "", region: "", role: "" });
  const [requestedIds, setRequestedIds] = useState([]);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/matchmaking/recommendations");
      setRecommendations(response.data.data);
    } catch (error) {
      const message = getErrorMessage(error);
      setError(message);
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(
    () =>
      recommendations.filter(({ profile: player }) => {
        const game = getPrimaryGame(player);
        return (
          (!filters.game || game?.gameName === filters.game) &&
          (!filters.region || player.region === filters.region) &&
          (!filters.role || game?.roles?.includes(filters.role))
        );
      }),
    [recommendations, filters]
  );

  const sendRequest = async (targetProfile) => {
    const targetUserId = targetProfile.userId?._id || targetProfile.userId;
    setRequestedIds((current) => [...current, targetUserId]);
    try {
      await api.post("/requests", {
        type: "teammate",
        toUser: targetUserId,
        message: "Our ClutchQ match score looks strong. Want to queue tonight?"
      });
      showToast("Teammate request sent");
    } catch (error) {
      setRequestedIds((current) => current.filter((id) => id !== targetUserId));
      showToast(getErrorMessage(error), "error");
    }
  };

  const best = filtered[0];

  return (
    <PageShell
      title={profile?.displayName ? `Welcome, ${profile.displayName}` : "Dashboard"}
      eyebrow="Overview"
      actions={<Link to="/lobbies/create" className="btn-primary">Create Lobby</Link>}
    >
      <div className="grid gap-6">
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard label="Recommended players" value={filtered.length} />
          <StatCard label="Best match score" value={best?.match?.totalScore || 0} suffix="%" accent="green" />
          <StatCard label="Trust score" value={profile?.trustScore || 0} suffix="%" accent="violet" />
          <StatCard label="Availability hours" value={profile?.availability?.length || 0} accent="amber" />
        </div>
        {error ? <ErrorState message={error} onRetry={load} /> : null}
        <div className="grid gap-6 xl:grid-cols-[0.78fr_1.22fr]">
          <div className="space-y-6">
            <FindSquadNow />
            <PlayerFilters filters={filters} onChange={setFilters} />
            {best && <LiveDNAVisualizer breakdown={best.match.breakdown} totalScore={best.match.totalScore} />}
          </div>
          <RecommendedPlayers recommendations={filtered} loading={loading} onSendRequest={sendRequest} requestedIds={requestedIds} />
        </div>
      </div>
    </PageShell>
  );
};

export default Dashboard;
