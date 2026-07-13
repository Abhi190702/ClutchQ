import { useState } from "react";
import { formatMinutes } from "../../utils/formatters";
import DetailDrawer from "../common/DetailDrawer";
import ProfileEmptyState from "./ProfileEmptyState";

const Signal = ({ label, value, helper }) => (
  <div className="border-l border-white/10 pl-3">
    <div className="text-xs font-semibold text-clutch-muted">{label}</div>
    <div className="mt-2 text-xl font-black leading-tight text-clutch-text">{value}</div>
    {helper && <div className="mt-2 text-sm leading-6 text-clutch-muted">{helper}</div>}
  </div>
);

const MatchAnalyticsStory = ({ insights, recentActivitySummary, profile, graph, scorecards = [], embedded = false }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const sessions = recentActivitySummary?.sessions || [];
  const scorecardRows = scorecards.map((card) => ({
    _id: card._id,
    gameName: card.gameName,
    durationMinutes: card.extractedStats?.durationMinutes,
    status: "scorecard analysis",
    signalScore: card.performance?.overall,
    summary: card.summary?.[0],
    createdAt: card.createdAt
  }));
  const analyses = [
    ...scorecardRows,
    ...(insights?.recentAnalyses || []),
    ...(recentActivitySummary?.analysis || [])
  ];
  const primaryGame = profile?.games?.find((game) => game.isPrimary) || profile?.games?.[0];
  const recommended = graph?.gameProfiles?.[0]?.gameName || insights?.recommendedGames?.[0]?.name || primaryGame?.gameName || "Create or join a ClutchQ room";
  const mainStyle = graph?.style?.mainStyle || insights?.mainGenre || "Building profile";
  const bestSquadFit = graph?.style?.bestSquadFit || insights?.bestSquadFit || "Ranked squad with clear roles";
  const getSignalScore = (item) => item.signalScore ?? item.matchRating ?? item.teamworkScore ?? item.communicationScore ?? "";

  return (
    <section className={embedded ? "py-8 xl:border-l xl:border-white/10 xl:pl-10" : "border-b border-white/10 py-6 md:py-8"}>
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="eyebrow">Squad fit</div>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-clutch-text">Squad fit summary</h2>
        </div>
        <button type="button" className="btn-secondary" onClick={() => setDrawerOpen(true)}>
          View match signals
        </button>
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-3">
        <Signal label="Main style" value={mainStyle} helper={graph ? "Based on Gameplay Graph signals." : "Based on synced history."} />
        <Signal label="Best squad fit" value={bestSquadFit} helper="Useful for mic-required rooms." />
        <Signal label="Recommended game" value={recommended} helper={profile?.micAvailable ? "Mic-ready profile." : "Add mic status for better matches."} />
      </div>

      <DetailDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Matchmaking signals"
        subtitle={graph ? "Scorecards, sessions, Steam context, and Python graph signals that shape this profile." : "Recent sessions and Steam signals that shape this profile."}
      >
        {!analyses.length && !sessions.length ? (
          <ProfileEmptyState
            title="No ClutchQ session story yet."
            description="Start or join rooms, then rate sessions to build communication, teamwork, and reliability signals."
          />
        ) : (
          <div className="space-y-2">
            {[...analyses, ...sessions].slice(0, 10).map((item) => (
              <div key={item._id || `${item.gameName}-${item.createdAt || item.startedAt}`} className="border-b border-white/10 py-3 last:border-b-0">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-base font-black text-clutch-text">{item.gameName || item.gameSlug || "ClutchQ Session"}</div>
                    <div className="mt-1 text-sm leading-6 text-clutch-muted">
                      {item.durationMinutes ? formatMinutes(item.durationMinutes) : "Session analysis"} - {item.status || "tracked"}
                    </div>
                    {item.summary ? <div className="mt-1 text-sm leading-6 text-zinc-500">{item.summary}</div> : null}
                  </div>
                  <div className="text-sm font-black text-[#39D353]">{getSignalScore(item)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </DetailDrawer>
    </section>
  );
};

export default MatchAnalyticsStory;
