import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PageShell from "../components/common/PageShell";
import ErrorState from "../components/common/ErrorState";
import MetricStrip from "../components/common/MetricStrip";
import SectionHeader from "../components/common/SectionHeader";
import SoftGlow from "../components/common/SoftGlow";
import FindSquadNow from "../components/dashboard/FindSquadNow";
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

  const load = useCallback(async () => {
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
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

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
  const hasBestScore = best?.match?.totalScore !== null && best?.match?.totalScore !== undefined && Number.isFinite(Number(best.match.totalScore));
  const bestScoreLabel = hasBestScore ? `${Math.round(Number(best.match.totalScore))}%` : "--";
  const trustLabel = profile?.trustScore !== null && profile?.trustScore !== undefined && Number.isFinite(Number(profile.trustScore))
    ? `${Math.round(Number(profile.trustScore))}%`
    : "Building";
  const metrics = [
    { label: "Recommended", value: filtered.length, helper: "players ready" },
    { label: "Best match", value: bestScoreLabel, helper: best?.profile?.displayName || "Build profile data" },
    { label: "Trust", value: trustLabel, helper: `${profile?.totalReviews || 0} reviews` },
    { label: "Availability", value: `${profile?.availability?.length || 0}h`, helper: "weekly overlap" },
    { label: "Primary game", value: primaryGame?.gameName || "Not set", helper: primaryGame?.rank || "Complete onboarding" }
  ];

  return (
    <PageShell fullWidth>
      <div className="grid gap-10">
        <section className="relative overflow-hidden rounded-[30px] bg-[linear-gradient(135deg,rgba(56,189,248,0.08),rgba(255,255,255,0.025)_42%,rgba(167,139,250,0.06))] px-6 py-8 ring-1 ring-white/10 md:px-10 md:py-10">
          <SoftGlow />
          <div className="relative space-y-8">
            <SectionHeader
              eyebrow="Squad console"
              title={profile?.displayName ? `Welcome, ${profile.displayName}` : "Dashboard"}
              description={`${filtered.length} strong squad matches · Best ${bestScoreLabel} · Trust ${trustLabel}`}
              actions={
                <>
                  <a href="#squad-controls" className="btn-primary rounded-2xl px-5 py-3">Find Squad Now</a>
                  <Link to="/lobbies/create" className="btn-secondary rounded-2xl px-5 py-3">Create Lobby</Link>
                </>
              }
            />
            <MetricStrip metrics={metrics} variant="quiet" />
          </div>
        </section>
        {error ? <ErrorState message={error} onRetry={load} /> : null}
        <div className="grid gap-10 xl:grid-cols-[minmax(320px,0.36fr)_1fr]">
          <div id="squad-controls" className="h-fit rounded-[28px] bg-white/[0.025] p-6 ring-1 ring-white/10">
            <FindSquadNow />
            <PlayerFilters filters={filters} onChange={setFilters} />
          </div>
          <RecommendedPlayers recommendations={filtered} loading={loading} onSendRequest={sendRequest} requestedIds={requestedIds} />
        </div>
      </div>
    </PageShell>
  );
};

export default Dashboard;
