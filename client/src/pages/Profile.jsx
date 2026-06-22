import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import GameplayGraphPanel from "../components/intelligence/GameplayGraphPanel";
import TeammateEdgesPanel from "../components/intelligence/TeammateEdgesPanel";
import ConnectedAccountsPanel from "../components/profile/ConnectedAccountsPanel";
import GamingActivityVisual from "../components/profile/GamingActivityVisual";
import MatchAnalyticsStory from "../components/profile/MatchAnalyticsStory";
import PlayerScoreStory from "../components/profile/PlayerScoreStory";
import ProfileEmptyState from "../components/profile/ProfileEmptyState";
import ProfileHero from "../components/profile/ProfileHero";
import ProfileSettingsPanel from "../components/profile/ProfileSettingsPanel";
import ProfileShell from "../components/profile/ProfileShell";
import ProfileSkeleton from "../components/profile/ProfileSkeleton";
import ProfileTabs from "../components/profile/ProfileTabs";
import PlayerSnapshot from "../components/profile/PlayerSnapshot";
import SteamProfileSection from "../components/profile/SteamProfileSection";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { getErrorMessage } from "../services/api";
import intelligenceApi from "../services/intelligenceApi";
import profileApi from "../services/profileApi";
import steamApi from "../services/steamApi";
import { PROFILE_TABS } from "../utils/constants";

const fromResult = (result, fallback) => (result.status === "fulfilled" ? result.value.data.data : fallback);

const profileTabs = [
  { id: PROFILE_TABS.overview, label: "Overview" },
  { id: PROFILE_TABS.steam, label: "Steam" },
  { id: PROFILE_TABS.activity, label: "Activity" },
  { id: PROFILE_TABS.connections, label: "Connections" },
  { id: PROFILE_TABS.settings, label: "Settings" }
];

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
  const [searchParams, setSearchParams] = useSearchParams();
  const [bundle, setBundle] = useState(null);
  const [steam, setSteam] = useState(defaultSteamData);
  const [gameplayGraph, setGameplayGraph] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");

  const loadProfile = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError("");

    try {
      const [profileResult, syncStatusResult, libraryResult, recentResult, favoritesResult, achievementsResult, friendsResult, heatmapResult, insightsResult, graphResult] =
        await Promise.allSettled([
          profileApi.getProfile(),
          steamApi.getSteamSyncStatus(),
          steamApi.getSteamLibrary(),
          steamApi.getSteamRecent(),
          steamApi.getSteamFavorites(),
          steamApi.getSteamAchievements(),
          steamApi.getSteamFriends(),
          steamApi.getSteamHeatmap(),
          steamApi.getSteamMatchInsights(),
          intelligenceApi.getMyGraph()
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
      setGameplayGraph(fromResult(graphResult, null)?.graph || null);
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
      <ProfileShell>
        <ProfileEmptyState
          title="Profile could not be loaded."
          description={error || "Try refreshing the page."}
          action={<Link to="/dashboard" className="btn-secondary">Back to dashboard</Link>}
        />
      </ProfileShell>
    );
  }

  const score = bundle.playerScore || {};
  const steamLinked = bundle.connectedAccounts?.some((account) => account.id === "steam" && account.status === "connected");
  const steamSyncStatus = steam.syncStatus || bundle.steamSyncStatus;
  const activeTab = profileTabs.some((tab) => tab.id === searchParams.get("tab")) ? searchParams.get("tab") : PROFILE_TABS.overview;

  const setActiveTab = (tabId) => {
    setSearchParams(tabId === PROFILE_TABS.overview ? {} : { tab: tabId });
  };

  return (
    <ProfileShell>
      <ProfileHero
        bundle={bundle}
        libraryCount={steam.library.length}
        steamLinked={steamLinked}
        onAvatarUpload={handleAvatarUpload}
        onAvatarRemove={handleAvatarRemove}
        onSyncSteam={handleSteamSync}
        syncing={syncing}
      />

      <ProfileTabs tabs={profileTabs} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === PROFILE_TABS.overview && (
        <div className="space-y-6">
          <PlayerSnapshot bundle={bundle} library={steam.library} steamSummary={bundle.steamSummary} syncStatus={steamSyncStatus} />
          <GameplayGraphPanel graph={gameplayGraph} />
          <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <PlayerScoreStory score={score} />
            <MatchAnalyticsStory insights={steam.insights} recentActivitySummary={bundle.recentActivitySummary} profile={bundle.profile} />
          </div>
          <TeammateEdgesPanel edges={gameplayGraph?.teammateEdges || []} />
          <ConnectedAccountsPanel accounts={bundle.connectedAccounts} steamSummary={bundle.steamSummary} onSyncSteam={handleSteamSync} syncing={syncing} compact />
        </div>
      )}

      {activeTab === PROFILE_TABS.steam && (
        <SteamProfileSection
          steamSummary={bundle.steamSummary}
          steamLinked={steamLinked}
          syncStatus={steamSyncStatus}
          library={steam.library}
          recent={steam.recent}
          favorites={steam.favorites}
          achievements={steam.achievements}
          friends={steam.friends}
          onSyncSteam={handleSteamSync}
          syncing={syncing}
        />
      )}

      {activeTab === PROFILE_TABS.activity && (
        <div className="space-y-6">
          <GamingActivityVisual heatmap={steam.heatmap} library={steam.library} recentActivitySummary={bundle.recentActivitySummary} />
          <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <PlayerScoreStory score={score} />
            <MatchAnalyticsStory insights={steam.insights} recentActivitySummary={bundle.recentActivitySummary} profile={bundle.profile} />
          </div>
        </div>
      )}

      {activeTab === PROFILE_TABS.connections && (
        <ConnectedAccountsPanel accounts={bundle.connectedAccounts} steamSummary={bundle.steamSummary} onSyncSteam={handleSteamSync} syncing={syncing} />
      )}

      {activeTab === PROFILE_TABS.settings && (
        <ProfileSettingsPanel bundle={bundle} onAvatarUpload={handleAvatarUpload} onAvatarRemove={handleAvatarRemove} />
      )}
    </ProfileShell>
  );
};

export default Profile;
