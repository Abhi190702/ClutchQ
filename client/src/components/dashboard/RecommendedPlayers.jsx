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
    return <EmptyState title="No compatible players found." description="Try expanding your rank range, region, or availability." />;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {recommendations.map((item) => (
        <PlayerCard
          key={item.profile._id}
          item={item}
          onSendRequest={onSendRequest}
          requested={requestedIds.includes(item.profile.userId?._id || item.profile.userId)}
        />
      ))}
    </div>
  );
};

export default RecommendedPlayers;
