import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageShell from "../components/common/PageShell";
import EmptyState from "../components/common/EmptyState";
import SkeletonCard from "../components/common/SkeletonCard";
import AvailabilityHeatmap from "../components/profile/AvailabilityHeatmap";
import GameRankCard from "../components/profile/GameRankCard";
import PlayerBadges from "../components/profile/PlayerBadges";
import PlaystyleRadar from "../components/profile/PlaystyleRadar";
import ProfileCompleteness from "../components/profile/ProfileCompleteness";
import ProfileHeader from "../components/profile/ProfileHeader";
import SessionHistory from "../components/profile/SessionHistory";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { getErrorMessage } from "../services/api";
import api from "../services/api";

const Profile = () => {
  const { profile, refresh } = useAuth();
  const { showToast } = useToast();
  const [currentProfile, setCurrentProfile] = useState(profile);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(!profile);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        if (!currentProfile) setLoading(true);
        const data = await refresh();
        if (!alive) return;
        setCurrentProfile(data?.profile || profile);

        try {
          const response = await api.get("/sessions");
          if (alive) setSessions(response.data.data);
        } catch (error) {
          if (alive) showToast(getErrorMessage(error), "error");
        }
      } finally {
        if (alive) setLoading(false);
      }
    };

    load();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    setCurrentProfile(profile);
  }, [profile]);

  if (loading) {
    return (
      <PageShell title="Profile" eyebrow="Player identity">
        <SkeletonCard rows={8} />
      </PageShell>
    );
  }

  if (!currentProfile) {
    return (
      <PageShell title="Profile" eyebrow="Player identity">
        <EmptyState
          title="No gamer profile yet."
          description="Create your profile so ClutchQ can calculate match fit, availability overlap, and trust signals."
          action={<Link to="/onboarding" className="btn-primary">Start onboarding</Link>}
        />
      </PageShell>
    );
  }

  return (
    <PageShell
      title="My Profile"
      eyebrow="Player identity"
      actions={<Link to="/onboarding" className="btn-secondary">Edit profile</Link>}
    >
      <div className="grid min-w-0 gap-6">
        <ProfileHeader profile={currentProfile} actions={<Link to="/dashboard" className="btn-primary">Find matches</Link>} />
        <div className="grid min-w-0 gap-6 lg:grid-cols-[0.72fr_1.28fr]">
          <div className="min-w-0 space-y-6">
            <ProfileCompleteness value={currentProfile.profileCompleteness} />
            <PlayerBadges badges={currentProfile.badges} />
            <SessionHistory sessions={sessions} />
          </div>
          <div className="min-w-0 space-y-6">
            <div className="card min-w-0 p-5">
              <h3 className="mb-4 text-lg font-semibold">Games and roles</h3>
              <div className="grid gap-3 md:grid-cols-2">
                {currentProfile.games?.map((game) => <GameRankCard key={game.gameName} game={game} />)}
              </div>
            </div>
            <div className="card min-w-0 p-5">
              <h3 className="mb-4 text-lg font-semibold">Availability heatmap</h3>
              <AvailabilityHeatmap value={currentProfile.availability} readonly />
            </div>
            <PlaystyleRadar stats={currentProfile.playstyleStats} />
          </div>
        </div>
      </div>
    </PageShell>
  );
};

export default Profile;
