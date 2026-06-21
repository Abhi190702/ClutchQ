import { formatMinutes } from "../../utils/formatters";
import ProfileEmptyState from "./ProfileEmptyState";

const MatchAnalyticsPanel = ({ insights, recentActivitySummary }) => {
  const analyses = insights?.recentAnalyses || recentActivitySummary?.analysis || [];
  const sessions = recentActivitySummary?.sessions || [];

  return (
    <section id="analytics" className="card p-5 md:p-6">
      <div>
        <div className="eyebrow">Match analytics</div>
        <h2 className="mt-2 text-2xl font-bold text-clutch-text">Squad fit signals</h2>
        <p className="mt-2 text-sm text-clutch-muted">A practical read of recent ClutchQ sessions and Steam context.</p>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <div className="rounded-md border border-clutch-border bg-clutch-bg/40 p-4">
          <div className="text-xs text-clutch-muted">Favorite game</div>
          <div className="mt-2 text-lg font-bold text-clutch-text">{insights?.favoriteGame || "Not enough data"}</div>
        </div>
        <div className="rounded-md border border-clutch-border bg-clutch-bg/40 p-4">
          <div className="text-xs text-clutch-muted">Main style</div>
          <div className="mt-2 text-lg font-bold text-clutch-text">{insights?.mainGenre || "Building profile"}</div>
        </div>
        <div className="rounded-md border border-clutch-border bg-clutch-bg/40 p-4">
          <div className="text-xs text-clutch-muted">Best squad fit</div>
          <div className="mt-2 text-sm font-semibold leading-6 text-clutch-text">{insights?.bestSquadFit || "Play through ClutchQ rooms to learn this."}</div>
        </div>
      </div>
      {!analyses.length && !sessions.length ? (
        <div className="mt-5">
          <ProfileEmptyState title="Play through ClutchQ rooms to build match analytics." description="Ratings, teamwork, communication, and reliability will appear here after sessions." />
        </div>
      ) : (
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <div>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.14em] text-clutch-muted">Recent analysis</h3>
            <div className="space-y-3">
              {analyses.slice(0, 4).map((item) => (
                <div key={item._id || `${item.gameName}-${item.createdAt}`} className="rounded-md border border-clutch-border bg-clutch-bg/40 p-4">
                  <div className="flex justify-between gap-3">
                    <h3 className="font-bold text-clutch-text">{item.gameName || "ClutchQ Session"}</h3>
                    <span className="text-sm font-bold text-clutch-blue">{item.matchRating || "--"}</span>
                  </div>
                  <p className="mt-2 text-sm text-clutch-muted">Communication {item.communicationScore || "--"} - Teamwork {item.teamworkScore || "--"} - Trust {item.trustImpact ? `${item.trustImpact > 0 ? "+" : ""}${item.trustImpact}` : "0"}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.14em] text-clutch-muted">Recent sessions</h3>
            <div className="space-y-3">
              {sessions.slice(0, 4).map((item) => (
                <div key={item._id || `${item.gameName}-${item.startedAt}`} className="rounded-md border border-clutch-border bg-clutch-bg/40 p-4">
                  <h3 className="font-bold text-clutch-text">{item.gameName || item.gameSlug || "ClutchQ Session"}</h3>
                  <p className="mt-2 text-sm text-clutch-muted">{formatMinutes(item.durationMinutes || 0)} - {item.status || "completed"}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default MatchAnalyticsPanel;
