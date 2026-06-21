import { formatHours, formatNumber } from "../../utils/formatters";

const ActivitySnapshotStrip = ({ snapshot }) => {
  const metrics = [
    ["Total Playtime", formatHours(snapshot.totalMinutes)],
    ["This Week", formatHours(snapshot.weekMinutes)],
    ["This Month", formatHours(snapshot.monthMinutes)],
    ["Sessions", formatNumber(snapshot.sessionsCount)],
    ["Best Rated", snapshot.bestRatedGame],
    ["Current Streak", snapshot.streak ? `${snapshot.streak} days` : "No streak yet"]
  ];

  return (
    <section className="overflow-hidden rounded-3xl bg-white/[0.045]">
      <div className="grid gap-px bg-white/10 sm:grid-cols-2 lg:grid-cols-6">
        {metrics.map(([label, value]) => (
          <div key={label} className="bg-[#17171b] px-5 py-5">
            <div className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-500">{label}</div>
            <div className="mt-2 truncate text-xl font-black text-white">{value}</div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ActivitySnapshotStrip;
