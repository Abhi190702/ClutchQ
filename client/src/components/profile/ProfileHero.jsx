import { Link } from "react-router-dom";
import { startProviderOAuth } from "../../utils/oauthLinks";
import ProfileAvatarUploader from "./ProfileAvatarUploader";
import ProfileStatCards from "./ProfileStatCards";

const ProfileHero = ({ bundle, libraryCount, steamLinked, onAvatarUpload, onAvatarRemove, onSyncSteam, syncing, minimal = false }) => {
  const { user, profile, steamSummary, playerScore } = bundle;
  const displayName = profile?.displayName || user?.name || steamSummary?.displayName || "ClutchQ Player";
  const tag = profile?.playerCode || profile?.clutchTag || `CLQ-${String(user?._id || "PLAYER").slice(-5).toUpperCase()}`;
  const primaryGame = profile?.games?.find((game) => game.isPrimary) || profile?.games?.[0];
  const roles = primaryGame?.roles?.slice(0, 3) || [];

  return (
    <section id="overview" className="card overflow-hidden">
      <div className={`${minimal ? "" : "border-b border-clutch-border"} bg-[#18181c] px-5 py-6 md:px-7`}>
        <div className={`flex flex-col gap-6 ${minimal ? "md:flex-row md:items-center" : "md:flex-row md:items-center"}`}>
          <ProfileAvatarUploader user={user} profile={profile} steamSummary={steamSummary} onUpload={onAvatarUpload} onRemove={onAvatarRemove} compact={minimal} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-clutch-border bg-clutch-panel px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-clutch-muted">
                {steamLinked ? "Steam connected" : steamSummary?.demo ? "Demo Steam preview" : "ClutchQ account"}
              </span>
              {profile?.micAvailable && <span className="rounded-full border border-clutch-green/30 bg-clutch-green/10 px-3 py-1 text-xs font-bold text-emerald-200">Mic ready</span>}
            </div>
            <h1 className={`mt-4 break-words font-black tracking-tight text-clutch-text ${minimal ? "text-3xl md:text-4xl" : "text-4xl md:text-5xl"}`}>{displayName}</h1>
            <p className="mt-2 text-sm font-semibold text-clutch-muted">{tag}</p>
            <p className={`mt-4 max-w-3xl text-base leading-7 text-zinc-300 ${minimal ? "line-clamp-2" : ""}`}>
              {profile?.bio || "Build your Steam-powered ClutchQ identity with games, achievements, friends, reliable lobbies, and teammate reviews."}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-md border border-clutch-border bg-clutch-panel px-3 py-2 text-sm text-clutch-muted">{profile?.region || "Region not set"}</span>
              <span className="rounded-md border border-clutch-border bg-clutch-panel px-3 py-2 text-sm text-clutch-muted">{primaryGame?.gameName || "Primary game not set"}</span>
              {roles.map((role) => (
                <span key={role} className="rounded-md border border-clutch-border bg-clutch-panel px-3 py-2 text-sm text-clutch-muted">{role}</span>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/onboarding" className="btn-secondary">Edit profile</Link>
              <Link to="/dashboard" className="btn-primary">Find matches</Link>
              {steamLinked ? (
                <button type="button" className="btn-secondary" onClick={onSyncSteam} disabled={syncing}>
                  {syncing ? "Syncing..." : "Sync Steam"}
                </button>
              ) : (
                <button type="button" className="btn-secondary" onClick={() => startProviderOAuth("steam", "/profile")}>
                  Connect Steam
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      {!minimal && (
        <div className="p-5 md:p-7">
          <ProfileStatCards profile={profile} playerScore={playerScore} libraryCount={libraryCount} />
        </div>
      )}
    </section>
  );
};

export default ProfileHero;
