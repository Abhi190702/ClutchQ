import { useMemo } from "react";
import { formatMinutes, formatShortDate, safeNumber } from "../../utils/formatters";

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

const normalizeDays = (days = []) => {
  const source = days
    .map((day) => ({
      ...day,
      date: toDateKey(day.date),
      minutes: safeNumber(day.minutes ?? day.totalMinutes)
    }))
    .filter((day) => day.date);
  const byDate = new Map(source.map((day) => [day.date, day]));
  const endDate = source.length ? new Date(source[source.length - 1].date) : new Date();
  const startDate = addDays(endDate, -55);

  return Array.from({ length: 56 }, (_, index) => {
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

const gameSummary = (games = []) =>
  games.length ? ` - ${games.slice(0, 2).map((game) => game.gameName || game.name).filter(Boolean).join(", ")}` : "";

const monthLabel = (dateKey) => {
  const date = new Date(dateKey);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("en", { month: "short" });
};

const ActivityCalendarStrip = ({ days = [], compact = false }) => {
  const visibleDays = useMemo(() => normalizeDays(days), [days]);
  const totalMinutes = useMemo(() => visibleDays.reduce((sum, day) => sum + safeNumber(day.minutes), 0), [visibleDays]);
  const activeDays = useMemo(() => visibleDays.filter((day) => safeNumber(day.minutes) > 0).length, [visibleDays]);
  const maxMinutes = useMemo(() => Math.max(...visibleDays.map((day) => safeNumber(day.minutes)), 0), [visibleDays]);
  const peak = useMemo(() => visibleDays.reduce((best, day) => (day.minutes > best.minutes ? day : best), visibleDays[0]), [visibleDays]);
  const monthMarks = visibleDays.reduce((marks, day, index) => {
    if (index === 0 || monthLabel(day.date) !== monthLabel(visibleDays[index - 1].date)) {
      marks.push({ index, label: monthLabel(day.date) });
    }
    return marks;
  }, []);

  return (
    <section className={`${compact ? "" : "border-b border-white/10 pb-6"}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="eyebrow mb-2">Rhythm evidence</div>
          <h2 className={`${compact ? "text-xl" : "text-2xl"} font-black text-white`}>56-day activity strip</h2>
          <p className="mt-2 text-sm text-zinc-500">
            {formatShortDate(visibleDays[0].date)} - {formatShortDate(visibleDays[visibleDays.length - 1].date)}
          </p>
        </div>
        <div className="text-sm font-semibold text-zinc-400">
          {activeDays} active days · {formatMinutes(totalMinutes)} tracked · peak {formatMinutes(peak.minutes)}
        </div>
      </div>

      <div className="mt-5 rounded-[18px] border border-white/10 bg-[#101116] p-4">
        <div className="relative pb-5">
          <div className="grid gap-1.5" style={{ gridTemplateColumns: "repeat(56, minmax(0, 1fr))" }}>
            {visibleDays.map((day) => {
              const minutes = safeNumber(day.minutes);
              const ratio = maxMinutes ? minutes / maxMinutes : 0;
              const height = minutes ? Math.max(8, Math.round(8 + ratio * 34)) : 6;
              const opacity = minutes ? Math.max(0.38, 0.42 + ratio * 0.58) : 0.18;
              return (
                <div key={day.date} className="flex h-12 items-end justify-center">
                  <span
                    className="block w-full rounded-full bg-clutch-blue transition hover:bg-sky-300"
                    style={{ height: `${height}px`, opacity }}
                    title={`${formatShortDate(day.date)}: ${formatMinutes(minutes)}${gameSummary(day.games)}`}
                  />
                </div>
              );
            })}
          </div>
          <div className="absolute bottom-0 left-0 right-0 text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-600">
            {monthMarks.map((mark) => (
              <span key={`${mark.label}-${mark.index}`} className="absolute" style={{ left: `${(mark.index / 55) * 100}%` }}>
                {mark.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ActivityCalendarStrip;
