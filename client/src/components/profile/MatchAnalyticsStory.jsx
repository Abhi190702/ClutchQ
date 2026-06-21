import { formatMinutes } from "./profileDisplay";
import ProfileEmptyState from "./ProfileEmptyState";

const Signal = ({ label, value, helper }) => (
  <div className="border-b border-white/10 py-4 last:border-b-0">
    <div className="text-xs font-bold uppercase tracking-[0.16em] text-clutch-muted">{label}</div>
    <div className="mt-2 text-lg font-black text-clutch-text">{value}</div>
    {helper && <div className="mt-1 text-sm leading-6 text-clutch-muted">{helper}</div>}
  </div>
);

const MatchAnalyticsStory = ({ insights, recentActivitySummary, profile }) => {
  const sessions = recentActivitySummary?.sessions || [];
  const analyses = insights?.recentAnalyses || recentActivitySummary?.analysis || [];
  const primaryGame = profile?.games?.find((game) => game.isPrimary) || profile?.games?.[0];
  const recommended = insights?.recommendedGames?.[0]?.name || primaryGame?.gameName || "Create or join a ClutchQ room";

  return (
    <section className="rounded-md border border-white/10 bg-[#1b1b20] p-5 md:p-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="eyebrow">Squad fit</div>
          <h2 className="mt-2 text-2xl font-black text-clutch-text">Matchmaking signals</h2>
        </div>
        <p className="max-w-lg text-sm leading-6 text-clutch-muted">
          A practical summary of what kind of room and teammates fit this profile.
        </p>
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-md bg-black/15 px-4">
          <Signal label="Main style" value={insights?.mainGenre || "Building profile"} helper="Based on synced library and ClutchQ session history." />
          <Signal label="Best squad fit" value={insights?.bestSquadFit || "Play through rooms to learn this"} helper="Useful for ranked stacks, casual rooms, and mic-required lobbies." />
          <Signal label="Recommended room" value={recommended} helper={profile?.micAvailable ? "Mic-ready profile." : "Add mic status in settings for better matches."} />
        </div>

        {!analyses.length && !sessions.length ? (
          <ProfileEmptyState
            title="No ClutchQ session story yet."
            description="Start or join rooms, then rate sessions to build communication, teamwork, and reliability signals."
          />
        ) : (
          <div className="space-y-3">
            {[...analyses.slice(0, 3), ...sessions.slice(0, 3)].slice(0, 5).map((item) => (
              <div key={item._id || `${item.gameName}-${item.createdAt || item.startedAt}`} className="rounded-md bg-black/15 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-black text-clutch-text">{item.gameName || item.gameSlug || "ClutchQ Session"}</div>
                    <div className="mt-1 text-sm text-clutch-muted">
                      {item.durationMinutes ? formatMinutes(item.durationMinutes) : "Session analysis"} - {item.status || "tracked"}
                    </div>
                  </div>
                  <div className="text-sm font-black text-clutch-blue">{item.matchRating || item.teamworkScore || item.communicationScore || ""}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default MatchAnalyticsStory;
