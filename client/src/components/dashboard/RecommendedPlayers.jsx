import EmptyState from "../common/EmptyState";
import SkeletonCard from "../common/SkeletonCard";
import PlayerCard from "./PlayerCard";

const RecommendedPlayers = ({ recommendations, loading, onSendRequest, requestedIds }) => {
  const visibleRecommendations = recommendations.slice(0, 3);

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
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <div className="eyebrow mb-2">Recommended players</div>
          <h2 className="text-3xl font-black tracking-tight text-clutch-text">Best squad fits</h2>
        </div>
        <span className="text-sm font-semibold text-clutch-muted">Top {visibleRecommendations.length} of {recommendations.length}</span>
      </div>
      <div className="grid gap-3">
      {visibleRecommendations.map((item) => (
        <PlayerCard
          key={item.profile._id}
          item={item}
          onSendRequest={onSendRequest}
          requested={requestedIds.includes(item.profile.userId?._id || item.profile.userId)}
        />
      ))}
      </div>
    </section>
  );
};

export default RecommendedPlayers;
