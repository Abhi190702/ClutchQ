import EmptyState from "../common/EmptyState";
import { formatHours, safeNumber } from "../../utils/formatters";

const colors = ["#39D353", "#26A641", "#56D364", "#F2CC60", "#71717A"];

const GameTimeSplit = ({ items = [] }) => {
  const total = items.reduce((sum, item) => sum + safeNumber(item.minutes), 0);

  if (!total) {
    return (
      <section className="border-b border-white/10 pb-6">
        <div className="eyebrow mb-3">Game split</div>
        <h2 className="text-2xl font-black text-white">Game mix</h2>
        <EmptyState compact className="mt-5" title="No play split yet." description="Your top games will appear after sessions or Steam sync." />
      </section>
    );
  }

  const rows = items.map((item, index) => ({ ...item, percent: safeNumber(item.minutes) / total, color: colors[index % colors.length] }));

  return (
    <section className="border-b border-white/10 pb-6">
      <div className="eyebrow mb-3">Game split</div>
      <div className="mt-1 text-sm font-semibold text-zinc-500">{formatHours(total)} tracked across top games</div>
      <div className="mt-5 divide-y divide-white/10">
        {rows.map((item) => (
          <div key={item.gameName} className="py-3">
            <div className="mb-2 flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="truncate text-sm font-bold text-white">{item.gameName}</span>
              </div>
              <div className="text-right text-sm text-zinc-400">
                <span className="font-black text-white">{Math.round(item.percent * 100)}%</span> · {formatHours(item.minutes)}
              </div>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
              <div className="h-full rounded-full" style={{ width: `${Math.round(item.percent * 100)}%`, backgroundColor: item.color }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default GameTimeSplit;
