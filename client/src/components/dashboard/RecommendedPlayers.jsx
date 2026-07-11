import EmptyState from "../common/EmptyState";
import SkeletonCard from "../common/SkeletonCard";
import PlayerCard from "./PlayerCard";
import { getPrimaryGame } from "../../utils/rankLogic";
import { getGameArt } from "../../utils/gameArt";

const RecommendedPlayers = ({ recommendations, loading, onSendRequest, requestedIds }) => {
  const visibleRecommendations = recommendations.slice(0, 3);
  const leadGame = getPrimaryGame(visibleRecommendations[0]?.profile);
  const leadGameArt = getGameArt(leadGame?.gameName);

  if (loading) {
    return (
      <div className="grid gap-4">
        {Array.from({ length: 3 }).map((_, index) => <SkeletonCard key={index} rows={5} />)}
      </div>
    );
  }

  if (!recommendations.length) {
    return (
      <EmptyState
        title="No compatible players yet."
        description="Try expanding your filters, browse active lobbies, or create a lobby to let teammates come to you."
        compact
      />
    );
  }

  return (
    <section>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          {leadGameArt ? (
            <div className="h-14 w-14 overflow-hidden rounded-[18px] bg-clutch-panel shadow-[0_14px_36px_rgba(0,0,0,0.36)] ring-1 ring-white/10">
              <img src={leadGameArt} alt="" className="h-full w-full object-cover" />
            </div>
          ) : null}
          <div>
            <div className="eyebrow mb-2">Recommended players</div>
            <h2 className="text-3xl font-black tracking-[-0.04em] text-clutch-text md:text-4xl">Best squad fits</h2>
            <p className="mt-2 text-sm text-zinc-500">Rank, role, trust, voice, and schedule aligned.</p>
          </div>
        </div>
        <span className="text-sm font-semibold text-clutch-muted">Top {visibleRecommendations.length} of {recommendations.length}</span>
      </div>
      <div className="grid gap-4">
      {visibleRecommendations.map((item, index) => (
        <PlayerCard
          key={item.profile._id}
          item={item}
          featured={index === 0}
          onSendRequest={onSendRequest}
          requested={requestedIds.includes(item.profile.userId?._id || item.profile.userId)}
        />
      ))}
      </div>
    </section>
  );
};

export default RecommendedPlayers;
