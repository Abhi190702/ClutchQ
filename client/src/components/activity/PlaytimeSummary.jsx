const minutesToHours = (minutes = 0) => `${Math.round((minutes / 60) * 10) / 10}h`;

const PlaytimeSummary = ({ aggregates = [] }) => {
  const total = aggregates.reduce((sum, item) => sum + (item.totalMinutes || 0), 0);
  const week = aggregates.reduce((sum, item) => sum + (item.weeklyMinutes || 0), 0);
  const month = aggregates.reduce((sum, item) => sum + (item.monthlyMinutes || 0), 0);
  const sessions = aggregates.reduce((sum, item) => sum + (item.sessionsCount || 0), 0);

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {[
        ["Total Playtime", minutesToHours(total)],
        ["This Week", minutesToHours(week)],
        ["This Month", minutesToHours(month)],
        ["Sessions", sessions]
      ].map(([label, value]) => (
        <div key={label} className="rounded-[10px] border border-[#2f2f36] bg-[#202024] p-5">
          <div className="text-2xl font-black text-white">{value}</div>
          <div className="mt-1 text-sm text-zinc-400">{label}</div>
        </div>
      ))}
    </div>
  );
};

export default PlaytimeSummary;
