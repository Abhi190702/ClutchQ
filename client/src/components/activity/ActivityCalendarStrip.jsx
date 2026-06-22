import { useMemo } from "react";
import { formatHours, formatShortDate } from "../../utils/formatters";

const getIntensity = (minutes = 0) => {
  if (!minutes) return "bg-white/[0.045]";
  if (minutes < 60) return "bg-sky-900/70";
  if (minutes < 180) return "bg-sky-700/80";
  if (minutes < 360) return "bg-sky-500/85";
  return "bg-clutch-blue";
};

const fallbackDays = Array.from({ length: 56 }, (_, index) => ({
  date: `empty-${index}`,
  totalMinutes: 0,
  games: []
}));

const ActivityCalendarStrip = ({ days = [], compact = false }) => {
  const visibleDays = useMemo(() => (days.length ? days : fallbackDays).slice(compact ? -28 : -56), [compact, days]);
  const totalMinutes = useMemo(() => visibleDays.reduce((sum, day) => sum + (day.totalMinutes || 0), 0), [visibleDays]);
  const activeDays = useMemo(() => visibleDays.filter((day) => (day.totalMinutes || 0) > 0).length, [visibleDays]);

  return (
    <section className={`${compact ? "" : "border-b border-white/10 pb-6"}`}>
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="eyebrow mb-2">Activity strip</div>
          <h2 className={`${compact ? "text-xl" : "text-2xl"} font-black text-white`}>Recent rhythm</h2>
        </div>
        <div className="text-right text-sm font-semibold text-zinc-500">
          {activeDays} active days · {formatHours(totalMinutes)}
        </div>
      </div>
      <div className="mt-5 flex items-end gap-1.5 overflow-x-auto pb-1">
        {visibleDays.map((day) => {
          const minutes = day.totalMinutes || 0;
          const height = minutes ? Math.min(42, Math.max(10, Math.round(minutes / 10))) : 7;
          const dateKey = String(day.date || "");
          const title = dateKey.startsWith("empty")
            ? "No activity"
            : `${formatShortDate(day.date)} - ${formatHours(minutes)}${day.games?.length ? ` - ${day.games.slice(0, 2).map((game) => game.gameName).join(", ")}` : ""}`;

          return (
            <span
              key={day.date}
              title={title}
              className={`w-2.5 shrink-0 rounded-full ${getIntensity(minutes)}`}
              style={{ height }}
            />
          );
        })}
      </div>
    </section>
  );
};

export default ActivityCalendarStrip;
