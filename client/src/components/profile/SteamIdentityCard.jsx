import { formatDate } from "./profileDisplay";

const SteamIdentityCard = ({ steamSummary }) => {
  const connected = steamSummary?.connected;

  return (
    <section className="card p-5 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full border border-clutch-border bg-clutch-panelSoft">
            {connected && steamSummary?.avatar ? <img src={steamSummary.avatar} alt="" className="h-full w-full object-cover" /> : <span className="text-xl font-bold">S</span>}
          </div>
          <div className="min-w-0">
            <div className="eyebrow">Steam identity</div>
            <h2 className="mt-2 break-words text-2xl font-bold text-clutch-text">{connected ? steamSummary.displayName || "Steam Player" : "Steam not connected"}</h2>
            <p className="mt-1 text-sm text-clutch-muted">
              {connected ? `SteamID64 ${steamSummary.steamId}` : "Connect Steam to import public library, playtime, achievements, and friends."}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {connected && steamSummary?.profileUrl && (
            <a href={steamSummary.profileUrl} target="_blank" rel="noreferrer" className="btn-secondary">Open Steam</a>
          )}
        </div>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <div className="rounded-md border border-clutch-border bg-clutch-bg/40 p-4">
          <div className="text-xs font-bold uppercase tracking-[0.14em] text-clutch-muted">Level</div>
          <div className="mt-2 text-2xl font-bold text-clutch-text">{connected ? steamSummary?.level ?? "--" : "--"}</div>
        </div>
        <div className="rounded-md border border-clutch-border bg-clutch-bg/40 p-4">
          <div className="text-xs font-bold uppercase tracking-[0.14em] text-clutch-muted">Last synced</div>
          <div className="mt-2 text-sm font-semibold text-clutch-text">{connected ? formatDate(steamSummary?.lastSyncedAt) : "Not connected"}</div>
        </div>
        <div className="rounded-md border border-clutch-border bg-clutch-bg/40 p-4">
          <div className="text-xs font-bold uppercase tracking-[0.14em] text-clutch-muted">Privacy</div>
          <div className="mt-2 text-sm font-semibold text-clutch-text">{connected ? steamSummary?.privacyStatus || "Public or partial" : "Unknown"}</div>
        </div>
      </div>
    </section>
  );
};

export default SteamIdentityCard;
