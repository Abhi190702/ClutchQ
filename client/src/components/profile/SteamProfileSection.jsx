import { startProviderOAuth } from "../../utils/oauthLinks";
import PlatformIcon from "../platformIcons/PlatformIcon";
import AchievementShowcase from "./AchievementShowcase";
import FriendGraphPreview from "./FriendGraphPreview";
import SteamLibraryShelf from "./SteamLibraryShelf";
import { formatDate, formatHours } from "./profileDisplay";

const SteamMetric = ({ value, label }) => (
  <div>
    <div className="text-xl font-black text-clutch-text">{value}</div>
    <div className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-clutch-muted">{label}</div>
  </div>
);

const SteamProfileSection = ({
  steamSummary,
  steamLinked,
  syncStatus,
  library = [],
  recent = [],
  favorites = [],
  achievements,
  friends = [],
  onSyncSteam,
  syncing
}) => {
  const totalMinutes = library.reduce((sum, game) => sum + (game.playtimeForeverMinutes || 0), 0);
  const recentMinutes = library.reduce((sum, game) => sum + (game.playtimeLastTwoWeeksMinutes || 0), 0);
  const unplayed = library.filter((game) => !game.playtimeForeverMinutes).length;
  const warning = syncStatus?.warnings?.[0] || steamSummary?.warnings?.[0] || "";
  const hasSteam = steamLinked || steamSummary?.connected;

  return (
    <section className="rounded-md border border-white/10 bg-[#1b1b20]">
      <div className="grid gap-5 border-b border-white/10 p-5 md:grid-cols-[minmax(0,1fr)_auto] md:p-6">
        <div className="flex min-w-0 gap-4">
          <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full bg-clutch-panelSoft">
            {steamSummary?.avatar ? <img src={steamSummary.avatar} alt="" className="h-full w-full object-cover" /> : <PlatformIcon provider="steam" size={64} />}
          </div>
          <div className="min-w-0">
            <div className="eyebrow">Steam identity</div>
            <h2 className="mt-2 break-words text-3xl font-black text-clutch-text">{hasSteam ? steamSummary?.displayName || "Steam Player" : "Connect Steam"}</h2>
            <p className="mt-2 text-sm leading-6 text-clutch-muted">
              {hasSteam
                ? `SteamID64 ${steamSummary?.steamId || syncStatus?.steamId || "available after sync"}`
                : "Bring in public library, playtime, achievements, and friends for a richer ClutchQ profile."}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-start gap-2 md:justify-end">
          {steamSummary?.profileUrl && (
            <a href={steamSummary.profileUrl} target="_blank" rel="noreferrer" className="btn-secondary">
              Open Steam
            </a>
          )}
          {hasSteam ? (
            <button type="button" className="btn-primary" onClick={onSyncSteam} disabled={syncing}>
              {syncing ? "Syncing..." : "Sync Steam"}
            </button>
          ) : (
            <button type="button" className="btn-primary" onClick={() => startProviderOAuth("steam", "/profile?tab=steam")}>
              Connect Steam
            </button>
          )}
        </div>
      </div>

      <div className="p-5 md:p-6">
        <div className="grid gap-5 border-b border-white/10 pb-5 md:grid-cols-6">
          <SteamMetric value={library.length} label="Games owned" />
          <SteamMetric value={formatHours(totalMinutes)} label="Total playtime" />
          <SteamMetric value={formatHours(recentMinutes)} label="Last two weeks" />
          <SteamMetric value={unplayed} label="Unplayed" />
          <SteamMetric value={`${achievements?.completionPercentage || 0}%`} label="Achievements" />
          <SteamMetric value={syncStatus?.lastSyncedAt ? formatDate(syncStatus.lastSyncedAt) : "Not synced"} label="Last sync" />
        </div>

        {warning && (
          <div className="mt-5 rounded-md border border-clutch-amber/25 bg-clutch-amber/10 px-4 py-3 text-sm font-semibold text-amber-100">
            {warning}
          </div>
        )}

        <div className="mt-6">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <div className="eyebrow">Library shelf</div>
              <h3 className="mt-2 text-2xl font-black text-clutch-text">Games that define this profile</h3>
            </div>
          </div>
          <SteamLibraryShelf library={library} recent={recent} steamLinked={hasSteam} syncStatus={syncStatus} onSyncSteam={onSyncSteam} syncing={syncing} />
        </div>

        {!!favorites.length && (
          <div className="mt-7">
            <div className="eyebrow">Detected favorites</div>
            <div className="mt-4 grid gap-3 md:grid-cols-5">
              {favorites.slice(0, 5).map((item) => (
                <div key={item.label} className="rounded-md bg-black/15 p-3">
                  <div className="text-xs font-bold uppercase tracking-[0.14em] text-clutch-muted">{item.label}</div>
                  <div className="mt-2 line-clamp-1 font-black text-clutch-text">{item.game?.name || "Not enough data"}</div>
                  <div className="mt-1 line-clamp-2 text-xs leading-5 text-clutch-muted">{item.reason}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-7 grid gap-4 xl:grid-cols-2">
          <AchievementShowcase summary={achievements} />
          <FriendGraphPreview friends={friends} />
        </div>
      </div>
    </section>
  );
};

export default SteamProfileSection;
