import { startProviderOAuth } from "../../utils/oauthLinks";
import { formatDate } from "../../utils/formatters";

const statusTone = (status) => {
  if (status === "success") return "border-clutch-green/30 bg-clutch-green/10 text-emerald-200";
  if (status === "partial") return "border-clutch-amber/40 bg-clutch-amber/10 text-amber-100";
  if (status === "failed") return "border-clutch-red/40 bg-clutch-red/10 text-red-100";
  return "border-clutch-border bg-clutch-bg/40 text-clutch-muted";
};

const SteamIdentityCard = ({ steamSummary, steamLinked, syncStatus }) => {
  const connected = Boolean(steamLinked);
  const hasPreview = steamSummary?.connected;
  const warnings = syncStatus?.warnings?.length ? syncStatus.warnings : steamSummary?.warnings || [];
  const privateSections = syncStatus?.privateSections?.length ? syncStatus.privateSections : steamSummary?.privateSections || [];

  return (
    <section className="card p-5 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full border border-clutch-border bg-clutch-panelSoft">
            {hasPreview && steamSummary?.avatar ? <img src={steamSummary.avatar} alt="" className="h-full w-full object-cover" /> : <span className="text-xl font-bold">S</span>}
          </div>
          <div className="min-w-0">
            <div className="eyebrow">Steam identity</div>
            <h2 className="mt-2 break-words text-2xl font-bold text-clutch-text">{hasPreview ? steamSummary.displayName || "Steam Player" : "Steam not connected"}</h2>
            <p className="mt-1 text-sm text-clutch-muted">
              {connected
                ? `SteamID64 ${steamSummary.steamId}`
                : steamSummary?.demo
                  ? "This is demo Steam data. Connect your own Steam account to show your real profile."
                  : "Connect Steam to import public library, playtime, achievements, and friends."}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {connected && steamSummary?.profileUrl && (
            <a href={steamSummary.profileUrl} target="_blank" rel="noreferrer" className="btn-secondary">Open Steam</a>
          )}
          {!connected && (
            <button type="button" className="btn-primary" onClick={() => startProviderOAuth("steam", "/profile")}>Connect Steam</button>
          )}
        </div>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <div className="rounded-md border border-clutch-border bg-clutch-bg/40 p-4">
          <div className="text-xs font-bold uppercase tracking-[0.14em] text-clutch-muted">Level</div>
          <div className="mt-2 text-2xl font-bold text-clutch-text">{hasPreview ? steamSummary?.level ?? "--" : "--"}</div>
        </div>
        <div className="rounded-md border border-clutch-border bg-clutch-bg/40 p-4">
          <div className="text-xs font-bold uppercase tracking-[0.14em] text-clutch-muted">Last synced</div>
          <div className="mt-2 text-sm font-semibold text-clutch-text">{hasPreview ? formatDate(steamSummary?.lastSyncedAt) : "Not connected"}</div>
        </div>
        <div className="rounded-md border border-clutch-border bg-clutch-bg/40 p-4">
          <div className="text-xs font-bold uppercase tracking-[0.14em] text-clutch-muted">Privacy</div>
          <div className="mt-2 text-sm font-semibold text-clutch-text">{hasPreview ? steamSummary?.privacyStatus || "Public or partial" : "Unknown"}</div>
        </div>
      </div>
      {connected && (
        <div className="mt-4 rounded-md border border-clutch-border bg-clutch-bg/40 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-2.5 py-1 text-xs font-bold uppercase tracking-[0.12em] ${statusTone(syncStatus?.status)}`}>
              {syncStatus?.status || steamSummary?.syncStatus || "connected"}
            </span>
            <span className="text-sm font-semibold text-clutch-text">{syncStatus?.message || steamSummary?.syncMessage || "Steam connected. Run Sync Steam to import library data."}</span>
          </div>
          {warnings.length > 0 && (
            <div className="mt-3 space-y-1 text-sm text-amber-100">
              {warnings.map((warning) => <p key={warning}>{warning}</p>)}
            </div>
          )}
          {privateSections.length > 0 && (
            <p className="mt-3 text-sm text-clutch-muted">
              Private or unavailable sections: {privateSections.join(", ")}.
            </p>
          )}
        </div>
      )}
    </section>
  );
};

export default SteamIdentityCard;
