import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import PageShell from "../components/common/PageShell";
import SkeletonCard from "../components/common/SkeletonCard";
import MatchBreakdown from "../components/dashboard/MatchBreakdown";
import AvailabilityOverlap from "../components/profile/AvailabilityOverlap";
import PlaystyleRadar from "../components/profile/PlaystyleRadar";
import ProfileHeader from "../components/profile/ProfileHeader";
import PlayerBadges from "../components/profile/PlayerBadges";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import api, { getErrorMessage } from "../services/api";

const PlayerProfile = () => {
  const { id } = useParams();
  const { profile: currentProfile } = useAuth();
  const { showToast } = useToast();
  const [data, setData] = useState(null);
  const [fallbackProfile, setFallbackProfile] = useState(null);
  const [requested, setRequested] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.get(`/matchmaking/compare/${id}`);
        setData(response.data.data);
      } catch (error) {
        try {
          const fallback = await api.get(`/profiles/user/${id}`);
          setFallbackProfile(fallback.data.data);
        } catch {
          showToast(getErrorMessage(error), "error");
        }
      }
    };
    load();
  }, [id]);

  const targetProfile = data?.targetProfile || fallbackProfile;

  const sendRequest = async () => {
    const targetUser = targetProfile?.userId?._id || targetProfile?.userId;
    setRequested(true);
    try {
      await api.post("/requests", {
        type: "teammate",
        toUser: targetUser,
        message: "Your ClutchQ compatibility looks strong. Want to queue?"
      });
      showToast("Teammate request sent");
    } catch (error) {
      setRequested(false);
      showToast(getErrorMessage(error), "error");
    }
  };

  const report = async () => {
    const targetUser = targetProfile?.userId?._id || targetProfile?.userId;
    try {
      await api.post("/reports", {
        reportedUserId: targetUser,
        reason: "Profile review",
        details: "User reported from public profile page."
      });
      showToast("Report submitted for moderation", "info");
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    }
  };

  if (!targetProfile) {
    return (
      <PageShell title="Player Profile" eyebrow="Compatibility">
        <SkeletonCard rows={8} />
      </PageShell>
    );
  }

  return (
    <PageShell title={targetProfile.displayName} eyebrow="Player compatibility">
      <div className="grid gap-6">
        <ProfileHeader
          profile={targetProfile}
          actions={
            <div className="flex flex-wrap gap-3">
              <button disabled={requested} onClick={sendRequest} className="btn-primary" type="button">{requested ? "Request Sent" : "Send teammate request"}</button>
              <button onClick={report} className="btn-secondary" type="button">Report user</button>
            </div>
          }
        />
        <div className="grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
          <div className="space-y-6">
            <PlayerBadges badges={targetProfile.badges} />
            <PlaystyleRadar stats={currentProfile?.playstyleStats} compareStats={targetProfile.playstyleStats} />
          </div>
          <div className="space-y-6">
            {data?.match && (
              <div className="card p-5">
                <h3 className="mb-4 text-lg font-black">Why this player matches</h3>
                <MatchBreakdown match={data.match} />
              </div>
            )}
            <AvailabilityOverlap yours={currentProfile?.availability || []} theirs={targetProfile.availability || []} />
          </div>
        </div>
      </div>
    </PageShell>
  );
};

export default PlayerProfile;
