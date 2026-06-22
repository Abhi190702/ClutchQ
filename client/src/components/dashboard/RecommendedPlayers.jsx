import EmptyState from "../common/EmptyState";
import SkeletonCard from "../common/SkeletonCard";
import PlayerCard from "./PlayerCard";

const RecommendedPlayers = ({ recommendations, loading, onSendRequest, requestedIds }) => {
  if (loading) {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => <SkeletonCard key={index} rows={5} />)}
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
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <div className="eyebrow mb-2">Recommended players</div>
          <h2 className="text-2xl font-black tracking-tight text-clutch-text">Best squad fits</h2>
        </div>
        <span className="text-sm font-semibold text-clutch-muted">{recommendations.length} matches</span>
      </div>
      <div className="grid gap-x-5 lg:grid-cols-2">
      {recommendations.map((item) => (
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
