import { useMemo } from "react";
import { formatMinutes, formatShortDate, safeNumber } from "../../utils/formatters";

const levels = [
  "bg-[#161b18] border-white/[0.06]",
  "bg-[#0e4429] border-emerald-900/50",
  "bg-[#006d32] border-emerald-800/60",
  "bg-[#26a641] border-emerald-600/70",
  "bg-[#39d353] border-emerald-400/80"
];

const addDays = (date, amount) => {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
};

const toDateKey = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

const normalizeDays = (days = [], length) => {
  const source = days
    .map((day) => ({
      ...day,
      date: toDateKey(day.date),
      minutes: safeNumber(day.minutes ?? day.totalMinutes)
    }))
    .filter((day) => day.date);
  const byDate = new Map(source.map((day) => [day.date, day]));
  const endDate = source.length ? new Date(source[source.length - 1].date) : new Date();
  const startDate = addDays(endDate, -(length - 1));

  return Array.from({ length }, (_, index) => {
    const date = addDays(startDate, index);
    const dateKey = date.toISOString().slice(0, 10);
    const existing = byDate.get(dateKey);
    return {
      date: dateKey,
      label: existing?.label || formatShortDate(dateKey),
      minutes: safeNumber(existing?.minutes),
      games: existing?.games || []
    };
  });
};

const getLevel = (minutes, maxMinutes) => {
  if (!minutes) return 0;
  if (!maxMinutes) return 0;
  const ratio = minutes / maxMinutes;
  if (ratio >= 0.78) return 4;
  if (ratio >= 0.48) return 3;
  if (ratio >= 0.22) return 2;
  return 1;
};

const buildWeeks = (days) =>
  Array.from({ length: Math.ceil(days.length / 7) }, (_, weekIndex) =>
    days.slice(weekIndex * 7, weekIndex * 7 + 7)
  );

const monthLabel = (week, index, weeks) => {
  const first = week[0]?.date ? new Date(week[0].date) : null;
  const previousWeek = index > 0 ? weeks[index - 1] : null;
  const previous = previousWeek?.[0]?.date ? new Date(previousWeek[0].date) : null;
  if (!first || Number.isNaN(first.getTime())) return "";
  if (!previous || first.getMonth() !== previous.getMonth()) {
    return first.toLocaleDateString("en", { month: "short" });
  }
  return "";
};

const weekdayLabel = (day, index) => {
  if (!day?.date || ![0, 2, 4].includes(index)) return "";
  return new Date(day.date).toLocaleDateString("en", { weekday: "short" });
};

const gameSummary = (games = []) =>
  games.length ? ` · ${games.slice(0, 2).map((game) => game.gameName || game.name).filter(Boolean).join(", ")}` : "";

const ActivityCalendarStrip = ({ days = [], compact = false }) => {
  const visibleDays = useMemo(() => normalizeDays(days, compact ? 28 : 56), [compact, days]);
  const weeks = useMemo(() => buildWeeks(visibleDays), [visibleDays]);
  const totalMinutes = useMemo(() => visibleDays.reduce((sum, day) => sum + safeNumber(day.minutes), 0), [visibleDays]);
  const activeDays = useMemo(() => visibleDays.filter((day) => safeNumber(day.minutes) > 0).length, [visibleDays]);
  const maxMinutes = useMemo(() => Math.max(...visibleDays.map((day) => safeNumber(day.minutes)), 0), [visibleDays]);

  return (
    <section className={`${compact ? "" : "border-b border-white/10 pb-6"}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="eyebrow mb-2">Contribution rhythm</div>
          <h2 className={`${compact ? "text-xl" : "text-2xl"} font-black text-white`}>Daily activity map</h2>
          <p className="mt-2 text-sm text-zinc-500">
            {formatShortDate(visibleDays[0].date)} - {formatShortDate(visibleDays[visibleDays.length - 1].date)}
          </p>
        </div>
        <div className="text-sm font-semibold text-zinc-400">
          {activeDays} active days · {formatMinutes(totalMinutes)} tracked
        </div>
      </div>

      <div className="mt-5 overflow-x-auto rounded-[14px] border border-white/10 bg-[#101411] p-4">
        <div className="min-w-[660px]">
          <div className="grid gap-1" style={{ gridTemplateColumns: `38px repeat(${weeks.length}, minmax(0, 1fr))` }}>
            <span />
            {weeks.map((week, index) => (
              <span key={`${week[0]?.date || "week"}-${index}`} className="text-[11px] font-bold text-zinc-600">
                {monthLabel(week, index, weeks)}
              </span>
            ))}
          </div>

          <div className="mt-2 grid gap-1" style={{ gridTemplateColumns: "38px 1fr" }}>
            <div className="grid grid-rows-7 gap-1">
              {(weeks[0] || []).map((day, index) => (
                <span key={day.date} className="h-3.5 text-[10px] font-bold leading-[14px] text-zinc-600">
                  {weekdayLabel(day, index)}
                </span>
              ))}
            </div>
            <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))` }}>
              {weeks.map((week, weekIndex) => (
                <div key={week[0]?.date || weekIndex} className="grid grid-rows-7 gap-1">
                  {week.map((day) => {
                    const level = getLevel(day.minutes, maxMinutes);
                    return (
                      <span
                        key={day.date}
                        title={`${formatShortDate(day.date)}: ${formatMinutes(day.minutes)}${gameSummary(day.games)}`}
                        className={`h-3.5 rounded-[3px] border ${levels[level]} transition-transform hover:scale-125 hover:ring-1 hover:ring-emerald-300/80`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-end gap-2 text-xs font-bold text-zinc-500">
            <span>Less</span>
            {levels.map((level, index) => (
              <span key={level} className={`h-3.5 w-3.5 rounded-[3px] border ${levels[index]}`} />
            ))}
            <span>More</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ActivityCalendarStrip;
