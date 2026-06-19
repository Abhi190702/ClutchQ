const SkeletonCard = ({ rows = 4 }) => (
  <div className="card animate-pulse p-5">
    <div className="mb-5 h-12 w-12 rounded-lg bg-slate-700/60" />
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="h-3 rounded-full bg-slate-700/60" style={{ width: `${92 - index * 13}%` }} />
      ))}
    </div>
  </div>
);

export default SkeletonCard;
