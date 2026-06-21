import { startProviderOAuth } from "../../utils/oauthLinks";
import PlatformIcon from "../platformIcons/PlatformIcon";
import AchievementShowcase from "./AchievementShowcase";
import FriendGraphPreview from "./FriendGraphPreview";
import SteamLibraryShelf from "./SteamLibraryShelf";
import { formatDate, formatHours } from "../../utils/formatters";

const SteamMetric = ({ value, label }) => (
  <div>
    <div className="text-3xl font-black text-clutch-text">{value}</div>
    <div className="mt-1 text-xs font-black uppercase tracking-[0.16em] text-clutch-muted">{label}</div>
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
    <section className="border-b border-white/10 py-8 md:py-10">
      <div className="grid gap-6 border-b border-white/10 pb-7 md:grid-cols-[minmax(0,1fr)_auto]">
        <div className="flex min-w-0 gap-4">
          <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full bg-clutch-panelSoft">
            {steamSummary?.avatar ? <img src={steamSummary.avatar} alt="" className="h-full w-full object-cover" /> : <PlatformIcon provider="steam" size={80} />}
          </div>
          <div className="min-w-0">
            <div className="eyebrow">Steam identity</div>
            <h2 className="mt-2 break-words text-4xl font-black tracking-tight text-clutch-text md:text-5xl">{hasSteam ? steamSummary?.displayName || "Steam Player" : "Connect Steam"}</h2>
            <p className="mt-3 text-base leading-7 text-clutch-muted">
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

      <div className="pt-7">
        <div className="grid gap-6 border-b border-white/10 pb-7 md:grid-cols-6">
          <SteamMetric value={library.length} label="Games owned" />
          <SteamMetric value={formatHours(totalMinutes)} label="Total playtime" />
          <SteamMetric value={formatHours(recentMinutes)} label="Last two weeks" />
          <SteamMetric value={unplayed} label="Unplayed" />
          <SteamMetric value={`${achievements?.completionPercentage || 0}%`} label="Achievements" />
          <SteamMetric value={syncStatus?.lastSyncedAt ? formatDate(syncStatus.lastSyncedAt) : "Not synced"} label="Last sync" />
        </div>

        {warning && (
          <div className="mt-5 border-l-2 border-clutch-amber/70 bg-clutch-amber/10 px-4 py-3 text-sm font-semibold text-amber-100">
            {warning}
          </div>
        )}

        <div className="mt-6">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <div className="eyebrow">Library shelf</div>
              <h3 className="mt-2 text-3xl font-black tracking-tight text-clutch-text">Games that define this profile</h3>
            </div>
          </div>
          <SteamLibraryShelf library={library} recent={recent} steamLinked={hasSteam} syncStatus={syncStatus} onSyncSteam={onSyncSteam} syncing={syncing} />
        </div>

        {!!favorites.length && (
          <div className="mt-7">
            <div className="eyebrow">Detected favorites</div>
            <div className="mt-4 grid divide-y divide-white/10 md:grid-cols-5 md:divide-x md:divide-y-0">
              {favorites.slice(0, 5).map((item) => (
                <div key={item.label} className="py-4 md:px-4 first:md:pl-0">
                  <div className="text-xs font-black uppercase tracking-[0.16em] text-clutch-muted">{item.label}</div>
                  <div className="mt-2 line-clamp-1 text-lg font-black text-clutch-text">{item.game?.name || "Not enough data"}</div>
                  <div className="mt-1 line-clamp-2 text-sm leading-5 text-clutch-muted">{item.reason}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 grid gap-8 xl:grid-cols-2">
          <AchievementShowcase summary={achievements} />
          <FriendGraphPreview friends={friends} />
        </div>
      </div>
    </section>
  );
};

export default SteamProfileSection;
