import { formatDate, formatHours } from "./profileDisplay";

const SnapshotMetric = ({ value, label, helper }) => (
  <div className="min-w-0 py-4">
    <div className="truncate text-4xl font-black tracking-tight text-clutch-text md:text-5xl">{value}</div>
    <div className="mt-2 text-xs font-black uppercase tracking-[0.18em] text-clutch-muted">{label}</div>
    {helper && <div className="mt-2 line-clamp-2 text-sm leading-5 text-zinc-500">{helper}</div>}
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
    <section className="border-b border-white/10 py-8 md:py-10">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="eyebrow">Player snapshot</div>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-clutch-text md:text-4xl">The useful profile facts, all in one place.</h2>
        </div>
        <p className="max-w-xl text-base leading-7 text-clutch-muted">
          A compact read of identity, trust, Steam depth, and current matchmaking fit.
        </p>
      </div>

      <div className="mt-8 grid gap-x-8 divide-y divide-white/10 md:grid-cols-5 md:divide-x md:divide-y-0">
        {metrics.map((metric) => (
          <div key={metric.label} className="md:px-6 first:md:pl-0 last:md:pr-0">
            <SnapshotMetric {...metric} />
          </div>
        ))}
      </div>
    </section>
  );
};

export default PlayerSnapshot;
