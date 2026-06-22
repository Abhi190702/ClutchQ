import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PageShell from "../components/common/PageShell";
import ErrorState from "../components/common/ErrorState";
import MetricStrip from "../components/common/MetricStrip";
import SectionHeader from "../components/common/SectionHeader";
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
  const primaryGame = getPrimaryGame(profile);
  const metrics = [
    { label: "Recommended", value: filtered.length, helper: "players ready" },
    { label: "Best match", value: `${best?.match?.totalScore || 0}%`, helper: best?.profile?.displayName || "Build profile data" },
    { label: "Trust", value: `${profile?.trustScore || 0}%`, helper: `${profile?.totalReviews || 0} reviews` },
    { label: "Availability", value: `${profile?.availability?.length || 0}h`, helper: "weekly overlap" },
    { label: "Primary game", value: primaryGame?.gameName || "Not set", helper: primaryGame?.rank || "Complete onboarding" }
  ];

  return (
    <PageShell fullWidth>
      <div className="grid gap-7">
        <section className="border-b border-white/10 pb-7">
          <SectionHeader
            eyebrow="Overview"
            title={profile?.displayName ? `Welcome, ${profile.displayName}` : "Dashboard"}
            description={`${filtered.length} strong squad matches available · Best match ${best?.match?.totalScore || 0}% · Trust ${profile?.trustScore || 0}%`}
            actions={
              <>
                <Link to="/lobbies/create" className="btn-primary">Create Lobby</Link>
                <a href="#squad-controls" className="btn-secondary">Find Squad Now</a>
              </>
            }
          />
          <MetricStrip metrics={metrics} className="mt-6" />
        </section>
        {error ? <ErrorState message={error} onRetry={load} /> : null}
        <div className="grid gap-8 xl:grid-cols-[0.38fr_0.62fr]">
          <div id="squad-controls" className="space-y-6">
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
