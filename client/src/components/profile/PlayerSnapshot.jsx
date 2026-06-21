import { formatDate, formatHours } from "./profileDisplay";

const SnapshotMetric = ({ value, label, helper }) => (
  <div className="min-w-0 py-3">
    <div className="truncate text-2xl font-black text-clutch-text">{value}</div>
    <div className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-clutch-muted">{label}</div>
    {helper && <div className="mt-1 truncate text-xs text-zinc-500">{helper}</div>}
  </div>
);

const PlayerSnapshot = ({ bundle, library = [], steamSummary, syncStatus }) => {
  const { profile, playerScore } = bundle;
  const primaryGame = profile?.games?.find((game) => game.isPrimary) || profile?.games?.[0];
  const totalMinutes = library.reduce((sum, game) => sum + (game.playtimeForeverMinutes || 0), 0);
  const trust = profile?.trustScore ?? profile?.averageRatings?.overall ?? 0;
  const lastSynced = syncStatus?.lastSyncedAt || steamSummary?.lastSyncedAt;

  const metrics = [
    { value: Math.round(playerScore?.overall ?? 0), label: "ClutchQ score", helper: playerScore?.explanation || "Player profile score" },
    { value: `${Math.round(trust)}%`, label: "Trust", helper: `${profile?.totalReviews || 0} teammate reviews` },
    { value: primaryGame?.gameName || "Not set", label: "Main game", helper: primaryGame?.rank || primaryGame?.tier || "Complete onboarding" },
    { value: library.length, label: "Steam library", helper: library.length ? `${formatHours(totalMinutes)} total playtime` : "Sync public games" },
    { value: lastSynced ? formatDate(lastSynced) : "Not synced", label: "Last Steam sync", helper: syncStatus?.status || steamSummary?.syncStatus || "Connect or sync Steam" }
  ];

  return (
    <section className="rounded-md border border-white/10 bg-[#1b1b20] p-5 md:p-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="eyebrow">Player snapshot</div>
          <h2 className="mt-2 text-2xl font-black text-clutch-text">The useful profile facts, all in one place.</h2>
        </div>
        <p className="max-w-xl text-sm leading-6 text-clutch-muted">
          A compact read of identity, trust, Steam depth, and current matchmaking fit.
        </p>
      </div>

      <div className="mt-5 grid gap-x-6 divide-y divide-white/10 md:grid-cols-5 md:divide-x md:divide-y-0">
        {metrics.map((metric) => (
          <div key={metric.label} className="md:px-5 first:md:pl-0 last:md:pr-0">
            <SnapshotMetric {...metric} />
          </div>
        ))}
      </div>
    </section>
  );
};

export default PlayerSnapshot;
