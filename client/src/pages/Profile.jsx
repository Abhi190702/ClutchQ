import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
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
import ProfileStatCards from "../components/profile/ProfileStatCards";
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
const steamSummaryWarning = (summary) => summary?.warnings?.[0] || summary?.syncMessage || "";

const profileTabs = [
  { id: "overview", label: "Overview" },
  { id: "steam", label: "Steam" },
  { id: "activity", label: "Activity" },
  { id: "settings", label: "Settings" }
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

const SummaryCard = ({ label, title, description, action }) => (
  <div className="card p-5">
    <div className="text-xs font-bold uppercase tracking-[0.14em] text-clutch-muted">{label}</div>
    <h3 className="mt-3 text-xl font-bold text-clutch-text">{title}</h3>
    <p className="mt-2 min-h-12 text-sm leading-6 text-clutch-muted">{description}</p>
    {action && <div className="mt-4">{action}</div>}
  </div>
);

const Profile = () => {
  const { refresh } = useAuth();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
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
  const activeTab = profileTabs.some((tab) => tab.id === searchParams.get("tab")) ? searchParams.get("tab") : "overview";
  const topGame = steam.library?.[0];
  const favoriteGame = steam.favorites?.[0]?.game;
  const syncWarning = steamSyncStatus?.warnings?.[0] || steamSummaryWarning(bundle.steamSummary);

  const setActiveTab = (tabId) => {
    setSearchParams(tabId === "overview" ? {} : { tab: tabId });
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
        minimal
      />

      <div className="card flex flex-col gap-3 p-3 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-2 overflow-x-auto">
          {profileTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 rounded-md px-4 py-2 text-sm font-bold transition ${
                activeTab === tab.id ? "bg-clutch-blue text-black" : "text-clutch-muted hover:bg-clutch-panelSoft hover:text-clutch-text"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <Link to="/onboarding" className="btn-secondary px-3 py-2 text-xs">Edit profile</Link>
      </div>

      {activeTab === "overview" && (
        <div className="space-y-5">
          <ProfileStatCards profile={bundle.profile} playerScore={score} libraryCount={steam.library.length} />
          <div className="grid gap-4 lg:grid-cols-3">
            <SummaryCard
              label="Steam status"
              title={steamLinked ? steamSyncStatus?.status || "Connected" : "Not connected"}
              description={syncWarning || steamSyncStatus?.message || (steamLinked ? "Connected. Sync to refresh library data." : "Connect Steam to import real library data.")}
              action={<button type="button" className="btn-secondary px-3 py-2 text-xs" onClick={() => setActiveTab("steam")}>Open Steam panel</button>}
            />
            <SummaryCard
              label="Main game"
              title={favoriteGame?.name || topGame?.name || "Not detected yet"}
              description={topGame ? `${Math.round((topGame.playtimeForeverMinutes || 0) / 60)}h tracked from Steam.` : "Sync Steam or play through ClutchQ to build this."}
              action={<button type="button" className="btn-secondary px-3 py-2 text-xs" onClick={() => setActiveTab("steam")}>View library</button>}
            />
            <SummaryCard
              label="Match profile"
              title={`${score?.overall ?? "--"} ClutchQ Score`}
              description="Minimal score view here. Detailed activity, heatmap, and match analysis live in Activity."
              action={<button type="button" className="btn-secondary px-3 py-2 text-xs" onClick={() => setActiveTab("activity")}>Open activity</button>}
            />
          </div>
        </div>
      )}

      {activeTab === "steam" && (
        <div className="space-y-5">
          <SteamIdentityCard steamSummary={bundle.steamSummary} steamLinked={steamLinked} syncStatus={steamSyncStatus} />
          <SteamLibraryPreview library={steam.library} recent={steam.recent} steamLinked={steamLinked} syncStatus={steamSyncStatus} isDemo={bundle.steamSummary?.demo} />
          <FavoriteGamesPanel favorites={steam.favorites} />
          <div className="grid gap-5 xl:grid-cols-2">
            <SteamAchievementsPanel summary={steam.achievements} />
            <SteamFriendsPanel friends={steam.friends} />
          </div>
        </div>
      )}

      {activeTab === "activity" && (
        <div className="space-y-5">
          <PlayerScorePanel score={score} />
          <SteamActivityHeatmap days={steam.heatmap} />
          <MatchAnalyticsPanel insights={steam.insights} recentActivitySummary={bundle.recentActivitySummary} />
          <ProfileBadgesPanel profile={bundle.profile} />
        </div>
      )}

      {activeTab === "settings" && (
        <div className="space-y-5">
          <ConnectedAccountsPanel accounts={bundle.connectedAccounts} steamSummary={bundle.steamSummary} onSyncSteam={handleSteamSync} syncing={syncing} />
          <PrivacyNoticeCard />
        </div>
      )}
    </ProfileShell>
  );
};

export default Profile;
