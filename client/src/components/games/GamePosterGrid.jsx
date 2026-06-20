import GameCard from "./GameCard";
import GameEmptyState from "./GameEmptyState";

const GamePosterGrid = ({ games = [] }) => {
  if (!games.length) {
    return <GameEmptyState title="No games found" description="Try a different search, genre, or platform filter." />;
  }

  return (
    <div className="grid gap-x-5 gap-y-9 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {games.map((game) => (
        <GameCard key={game.slug} game={game} />
      ))}
    </div>
  );
};

export default GamePosterGrid;
