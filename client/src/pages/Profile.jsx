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
import api from "../services/api";

const Profile = () => {
  const { profile, refresh } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      await refresh();
      const response = await api.get("/sessions");
      setSessions(response.data.data);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <PageShell title="Profile" eyebrow="Player identity">
        <SkeletonCard rows={8} />
      </PageShell>
    );
  }

  if (!profile) {
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
      <div className="grid gap-6">
        <ProfileHeader profile={profile} actions={<Link to="/dashboard" className="btn-primary">Find matches</Link>} />
        <div className="grid gap-6 lg:grid-cols-[0.72fr_1.28fr]">
          <div className="space-y-6">
            <ProfileCompleteness value={profile.profileCompleteness} />
            <PlayerBadges badges={profile.badges} />
            <SessionHistory sessions={sessions} />
          </div>
          <div className="space-y-6">
            <div className="card p-5">
              <h3 className="mb-4 text-lg font-black">Games and roles</h3>
              <div className="grid gap-3 md:grid-cols-2">
                {profile.games?.map((game) => <GameRankCard key={game.gameName} game={game} />)}
              </div>
            </div>
            <div className="card p-5">
              <h3 className="mb-4 text-lg font-black">Availability heatmap</h3>
              <AvailabilityHeatmap value={profile.availability} readonly />
            </div>
            <PlaystyleRadar stats={profile.playstyleStats} />
          </div>
        </div>
      </div>
    </PageShell>
  );
};

export default Profile;
