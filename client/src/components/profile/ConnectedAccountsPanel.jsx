import { startProviderOAuth } from "../../utils/oauthLinks";
import PlatformIcon from "../platformIcons/PlatformIcon";
import { formatDate } from "../../utils/formatters";
import { providerStatusClass, providerStatusLabel } from "./profileDisplay";

const providerCopy = {
  google: "Login identity",
  discord: "OAuth and lobby voice support",
  steam: "Library, playtime, achievements, and friends",
  epic: "Epic Games login",
  microsoft: "Microsoft and Xbox identity",
  psn: "Manual profile link planned",
  nintendo: "Manual profile link planned"
};

const ConnectedAccountsPanel = ({ accounts = [], steamSummary, onSyncSteam, syncing, compact = false }) => {
  const normalized = accounts.length
    ? accounts
    : [
        { id: "google", label: "Google", status: "not_connected" },
        { id: "discord", label: "Discord", status: "not_connected" },
        { id: "steam", label: "Steam", status: "not_connected" },
        { id: "epic", label: "Epic Games", status: "coming_soon" },
        { id: "microsoft", label: "Microsoft / Xbox", status: "coming_soon" },
        { id: "psn", label: "PlayStation Network", status: "manual_soon" },
        { id: "nintendo", label: "Nintendo Account", status: "manual_soon" }
      ];

  return (
    <section id="accounts" className="border-b border-white/10 py-8 md:py-10">
      <div className="flex flex-col gap-3 border-b border-white/10 pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="eyebrow">Account links</div>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-clutch-text md:text-4xl">Linked platforms</h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-clutch-muted">
            Connect gaming platforms to make the player identity easier to trust and match with.
          </p>
        </div>
        {steamSummary?.connected && (
          <button type="button" className="btn-secondary" onClick={onSyncSteam} disabled={syncing}>
            {syncing ? "Syncing Steam..." : "Sync Steam now"}
          </button>
        )}
      </div>
      <div className="mt-5 divide-y divide-white/10">
        {normalized.slice(0, compact ? 4 : normalized.length).map((account) => {
          const isSteam = account.id === "steam";
          const isConnectable = ["google", "discord", "steam"].includes(account.id) && account.status !== "connected";
          const canOpenProfile = isSteam && (account.profileUrl || steamSummary?.profileUrl);

          return (
            <div key={account.id} className="flex flex-col gap-4 py-5 md:flex-row md:items-center md:justify-between">
              <div className="flex min-w-0 gap-5">
                <PlatformIcon provider={account.id} size={58} />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xl font-black text-clutch-text">{account.label}</h3>
                    <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${providerStatusClass(account.status)}`}>
                      {providerStatusLabel(account.status)}
                    </span>
                  </div>
                  <p className="mt-1 text-base text-clutch-muted">{account.username || providerCopy[account.id] || "Identity provider"}</p>
                  {account.lastSyncedAt && <p className="mt-1 text-xs text-zinc-500">Last synced {formatDate(account.lastSyncedAt)}</p>}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {isConnectable && (
                  <button type="button" className="btn-secondary px-3 py-2 text-xs" onClick={() => startProviderOAuth(account.id, "/profile")}>
                    Connect
                  </button>
                )}
                {isSteam && account.status === "connected" && (
                  <button type="button" className="btn-secondary px-3 py-2 text-xs" onClick={onSyncSteam} disabled={syncing}>
                    Sync
                  </button>
                )}
                {canOpenProfile && (
                  <a className="btn-secondary px-3 py-2 text-xs" href={account.profileUrl || steamSummary.profileUrl} target="_blank" rel="noreferrer">
                    View profile
                  </a>
                )}
                {!isConnectable && account.status !== "connected" && (
                  <span className="rounded-md border border-white/10 px-3 py-2 text-xs font-semibold text-clutch-muted">Not ready yet</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default ConnectedAccountsPanel;
