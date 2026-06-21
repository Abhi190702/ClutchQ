import { formatMinutes } from "../../utils/formatters";
import ProfileEmptyState from "./ProfileEmptyState";

const Signal = ({ label, value, helper }) => (
  <div className="border-b border-white/10 py-5 last:border-b-0">
    <div className="text-xs font-black uppercase tracking-[0.18em] text-clutch-muted">{label}</div>
    <div className="mt-2 text-2xl font-black leading-tight text-clutch-text">{value}</div>
    {helper && <div className="mt-2 text-base leading-7 text-clutch-muted">{helper}</div>}
  </div>
);

const MatchAnalyticsStory = ({ insights, recentActivitySummary, profile }) => {
  const sessions = recentActivitySummary?.sessions || [];
  const analyses = insights?.recentAnalyses || recentActivitySummary?.analysis || [];
  const primaryGame = profile?.games?.find((game) => game.isPrimary) || profile?.games?.[0];
  const recommended = insights?.recommendedGames?.[0]?.name || primaryGame?.gameName || "Create or join a ClutchQ room";

  return (
    <section className="border-b border-white/10 py-8 md:py-10">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="eyebrow">Squad fit</div>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-clutch-text md:text-4xl">Matchmaking signals</h2>
        </div>
        <p className="max-w-lg text-base leading-7 text-clutch-muted">
          A practical summary of what kind of room and teammates fit this profile.
        </p>
      </div>

      <div className="mt-7 grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
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
              <div key={item._id || `${item.gameName}-${item.createdAt || item.startedAt}`} className="border-b border-white/10 py-4 last:border-b-0">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-lg font-black text-clutch-text">{item.gameName || item.gameSlug || "ClutchQ Session"}</div>
                    <div className="mt-1 text-sm leading-6 text-clutch-muted">
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
