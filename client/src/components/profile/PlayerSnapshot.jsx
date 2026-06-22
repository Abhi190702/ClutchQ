import { formatDate, formatHours, formatPercentage, safeNumber } from "../../utils/formatters";
import MetricStrip from "../common/MetricStrip";
import SectionHeader from "../common/SectionHeader";

const PlayerSnapshot = ({ bundle, library = [], steamSummary, syncStatus }) => {
  const { profile, playerScore } = bundle;
  const primaryGame = profile?.games?.find((game) => game.isPrimary) || profile?.games?.[0];
  const totalMinutes = library.reduce((sum, game) => sum + (game.playtimeForeverMinutes || 0), 0);
  const trust = safeNumber(profile?.trustScore ?? profile?.averageRatings?.overall, NaN);
  const lastSynced = syncStatus?.lastSyncedAt || steamSummary?.lastSyncedAt;

  const metrics = [
    { value: Math.round(playerScore?.overall ?? 0), label: "ClutchQ score", helper: playerScore?.explanation || "Player profile score" },
    { value: Number.isNaN(trust) ? "No data" : formatPercentage(trust), label: "Trust", helper: `${profile?.totalReviews || 0} teammate reviews` },
    { value: primaryGame?.gameName || "Not set", label: "Main game", helper: primaryGame?.rank || primaryGame?.tier || "Complete onboarding" },
    { value: library.length, label: "Steam library", helper: library.length ? `${formatHours(totalMinutes)} total playtime` : "Sync public games" },
    { value: lastSynced ? formatDate(lastSynced) : "Not synced", label: "Last Steam sync", helper: syncStatus?.status || steamSummary?.syncStatus || "Connect or sync Steam" }
  ];

  return (
    <section className="border-b border-white/10 py-6 md:py-8">
      <SectionHeader
        eyebrow="Player snapshot"
        title="Profile signals"
        description="A compact read of identity, trust, Steam depth, and current matchmaking fit."
        compact
      />
      <MetricStrip metrics={metrics} className="mt-6" />
    </section>
  );
};

export default PlayerSnapshot;
