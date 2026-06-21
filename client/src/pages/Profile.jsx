import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ConnectedAccountsPanel from "../components/profile/ConnectedAccountsPanel";
import FavoriteGamesPanel from "../components/profile/FavoriteGamesPanel";
import MatchAnalyticsPanel from "../components/profile/MatchAnalyticsPanel";
import PlayerScorePanel from "../components/profile/PlayerScorePanel";
import PrivacyNoticeCard from "../components/profile/PrivacyNoticeCard";
import ProfileBadgesPanel from "../components/profile/ProfileBadgesPanel";
import ProfileEmptyState from "../components/profile/ProfileEmptyState";
import ProfileHero from "../components/profile/ProfileHero";
import ProfileShell from "../components/profile/ProfileShell";
import ProfileSkeleton from "../components/profile/ProfileSkeleton";
import SteamAchievementsPanel from "../components/profile/SteamAchievementsPanel";
import SteamActivityHeatmap from "../components/profile/SteamActivityHeatmap";
import SteamFriendsPanel from "../components/profile/SteamFriendsPanel";
import SteamIdentityCard from "../components/profile/SteamIdentityCard";
import SteamLibraryPreview from "../components/profile/SteamLibraryPreview";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { getErrorMessage } from "../services/api";
import profileApi from "../services/profileApi";
import steamApi from "../services/steamApi";

const fromResult = (result, fallback) => (result.status === "fulfilled" ? result.value.data.data : fallback);

const defaultSteamData = {
  library: [],
  recent: [],
  favorites: [],
  achievements: null,
  friends: [],
  heatmap: [],
  insights: null,
  syncStatus: null
};

const Profile = () => {
  const { refresh } = useAuth();
  const { showToast } = useToast();
  const [bundle, setBundle] = useState(null);
  const [steam, setSteam] = useState(defaultSteamData);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");

  const loadProfile = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError("");

    try {
      const [profileResult, syncStatusResult, libraryResult, recentResult, favoritesResult, achievementsResult, friendsResult, heatmapResult, insightsResult] =
        await Promise.allSettled([
          profileApi.getProfile(),
          steamApi.getSteamSyncStatus(),
          steamApi.getSteamLibrary(),
          steamApi.getSteamRecent(),
          steamApi.getSteamFavorites(),
          steamApi.getSteamAchievements(),
          steamApi.getSteamFriends(),
          steamApi.getSteamHeatmap(),
          steamApi.getSteamMatchInsights()
        ]);

      const nextBundle = fromResult(profileResult, null);
      if (!nextBundle) throw new Error("Profile could not be loaded.");

      setBundle(nextBundle);
      setSteam({
        syncStatus: fromResult(syncStatusResult, nextBundle.steamSyncStatus || null),
        library: fromResult(libraryResult, []),
        recent: fromResult(recentResult, []),
        favorites: fromResult(favoritesResult, []),
        achievements: fromResult(achievementsResult, null),
        friends: fromResult(friendsResult, []),
        heatmap: fromResult(heatmapResult, []),
        insights: fromResult(insightsResult, null)
      });
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleAvatarUpload = async (dataUrl) => {
    const response = await profileApi.uploadAvatar(dataUrl);
    setBundle((current) => ({ ...current, profile: response.data.data }));
    await refresh();
    showToast("Profile photo updated.", "success");
  };

  const handleAvatarRemove = async () => {
    const response = await profileApi.deleteAvatar();
    setBundle((current) => ({ ...current, profile: response.data.data }));
    await refresh();
    showToast("Profile photo removed.", "success");
  };

  const handleSteamSync = async () => {
    setSyncing(true);
    try {
      const response = await steamApi.syncSteam();
      const warnings = response.data.data?.warnings || [];
      showToast(warnings[0] || response.data.message || "Steam synced successfully.", warnings.length ? "info" : "success");
      await loadProfile({ silent: true });
    } catch (syncError) {
      showToast(getErrorMessage(syncError), "error");
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <ProfileShell>
        <ProfileSkeleton />
      </ProfileShell>
    );
  }

  if (error || !bundle) {
    return (
      <ProfileShell actions={<Link to="/dashboard" className="btn-secondary">Back to dashboard</Link>}>
        <ProfileEmptyState title="Profile could not be loaded." description={error || "Try refreshing the page."} />
      </ProfileShell>
    );
  }

  const score = bundle.playerScore || {};
  const steamLinked = bundle.connectedAccounts?.some((account) => account.id === "steam" && account.status === "connected");
  const steamSyncStatus = steam.syncStatus || bundle.steamSyncStatus;

  return (
    <ProfileShell actions={<Link to="/onboarding" className="btn-secondary">Edit profile</Link>}>
      <ProfileHero
        bundle={bundle}
        libraryCount={steam.library.length}
        steamLinked={steamLinked}
        onAvatarUpload={handleAvatarUpload}
        onAvatarRemove={handleAvatarRemove}
        onSyncSteam={handleSteamSync}
        syncing={syncing}
      />
      <ConnectedAccountsPanel accounts={bundle.connectedAccounts} steamSummary={bundle.steamSummary} onSyncSteam={handleSteamSync} syncing={syncing} />
      <SteamIdentityCard steamSummary={bundle.steamSummary} steamLinked={steamLinked} syncStatus={steamSyncStatus} />
      <PlayerScorePanel score={score} />
      <SteamActivityHeatmap days={steam.heatmap} />
      <FavoriteGamesPanel favorites={steam.favorites} />
      <SteamLibraryPreview library={steam.library} recent={steam.recent} steamLinked={steamLinked} syncStatus={steamSyncStatus} isDemo={bundle.steamSummary?.demo} />
      <SteamAchievementsPanel summary={steam.achievements} />
      <SteamFriendsPanel friends={steam.friends} />
      <MatchAnalyticsPanel insights={steam.insights} recentActivitySummary={bundle.recentActivitySummary} />
      <ProfileBadgesPanel profile={bundle.profile} />
      <PrivacyNoticeCard />
    </ProfileShell>
  );
};

export default Profile;
