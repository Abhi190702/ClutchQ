import { Link } from "react-router-dom";
import { startProviderOAuth } from "../../utils/oauthLinks";
import { formatPercentage, safeNumber } from "../../utils/formatters";
import ProfileAvatarUploader from "./ProfileAvatarUploader";

const ProfileHero = ({ bundle, libraryCount, steamLinked, onAvatarUpload, onAvatarRemove, onSyncSteam, syncing }) => {
  const { user, profile, steamSummary, playerScore } = bundle;
  const displayName = profile?.displayName || user?.name || steamSummary?.displayName || "ClutchQ Player";
  const tag = profile?.playerCode || profile?.clutchTag || `CLQ-${String(user?._id || "PLAYER").slice(-5).toUpperCase()}`;
  const primaryGame = profile?.games?.find((game) => game.isPrimary) || profile?.games?.[0];
  const roles = primaryGame?.roles?.slice(0, 3) || [];
  const trust = safeNumber(profile?.trustScore ?? profile?.averageRatings?.overall, NaN);
  const meta = [
    profile?.region || "Region not set",
    primaryGame?.gameName || "Primary game not set",
    ...roles
  ].filter(Boolean);

  return (
    <section id="overview" className="overflow-hidden bg-[#18181c]">
      <div className="relative px-5 py-7 md:px-8 md:py-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(53,184,255,0.13),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.055),transparent_45%)]" />
        <div className="relative grid gap-7 lg:grid-cols-[210px_minmax(0,1fr)_auto] lg:items-center">
          <ProfileAvatarUploader
            user={user}
            profile={profile}
            steamSummary={steamSummary}
            onUpload={onAvatarUpload}
            onRemove={onAvatarRemove}
            variant="hero"
          />

          <div className="min-w-0 text-center lg:text-left">
            <div className="flex flex-wrap justify-center gap-2 lg:justify-start">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.04] px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-clutch-muted">
                <img src="/brand/clutchq-logo.png" alt="" className="h-5 w-5 rounded-md object-cover" />
                Official ClutchQ profile
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-clutch-muted">
                {steamLinked ? "Steam connected" : steamSummary?.demo ? "Demo Steam preview" : "ClutchQ account"}
              </span>
              {profile?.micAvailable && <span className="rounded-full border border-clutch-green/30 bg-clutch-green/10 px-3 py-1 text-xs font-bold text-emerald-200">Mic ready</span>}
              {!Number.isNaN(trust) && <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-bold text-clutch-muted">Trust {formatPercentage(trust)}</span>}
            </div>

            <h1 className="mt-4 break-words text-5xl font-black tracking-tight text-clutch-text md:text-6xl">{displayName}</h1>
            <p className="mt-2 text-sm font-black uppercase tracking-[0.18em] text-zinc-400">{tag}</p>
            <p className="mt-4 max-w-4xl text-base leading-7 text-zinc-300 md:text-lg">
              {profile?.bio || "Build your Steam-powered ClutchQ identity with games, achievements, friends, reliable lobbies, and teammate reviews."}
            </p>

            <div className="mt-5 flex flex-wrap justify-center gap-2 lg:justify-start">
              {meta.map((item) => (
                <span key={item} className="rounded-full bg-white/[0.055] px-3 py-2 text-sm font-semibold text-clutch-muted">{item}</span>
              ))}
              <span className="rounded-full bg-white/[0.055] px-3 py-2 text-sm font-semibold text-clutch-muted">{libraryCount} Steam games</span>
              {typeof playerScore?.overall === "number" && (
                <span className="rounded-full bg-white/[0.055] px-3 py-2 text-sm font-semibold text-clutch-muted">Score {Math.round(playerScore.overall)}</span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-3 lg:w-40 lg:flex-col">
            <Link to="/dashboard" className="btn-primary">Find matches</Link>
            <Link to="/onboarding" className="btn-secondary">Edit profile</Link>
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
    </section>
  );
};

export default ProfileHero;
