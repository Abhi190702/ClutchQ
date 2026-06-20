const GameSkeletonGrid = ({ count = 10 }) => (
  <div className="grid gap-x-5 gap-y-9 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="animate-pulse">
        <div className="aspect-[3/4] rounded-[10px] bg-[#202024]" />
        <div className="mt-3 h-3 w-20 rounded bg-[#202024]" />
        <div className="mt-2 h-4 w-36 rounded bg-[#202024]" />
        <div className="mt-2 h-3 w-28 rounded bg-[#202024]" />
      </div>
    ))}
  </div>
);

export default GameSkeletonGrid;
