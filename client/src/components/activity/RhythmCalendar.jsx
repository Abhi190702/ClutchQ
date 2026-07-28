import { useMemo } from "react";
import { safeNumber } from "../../utils/formatters";

const WEEKS = 26;
const WEEKDAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Keep date keying identical to buildPlaytimeSeries so cells line up with data.
const keyOf = (date) => date.toISOString().slice(0, 10);

const localMidnight = (offsetDays) => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - offsetDays);
  return date;
};

const levelFor = (minutes) => {
  if (minutes <= 0) return 0;
  if (minutes <= 30) return 1;
  if (minutes <= 60) return 2;
  if (minutes <= 120) return 3;
  return 4;
};

const LEVEL_CLASS = ["bg-white/[0.05]", "bg-clutch-blue/25", "bg-clutch-blue/45", "bg-clutch-blue/70", "bg-clutch-blue"];

const formatDayLabel = (date) =>
  date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" });

const formatMinutesShort = (minutes) => {
  if (minutes <= 0) return "No play";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  return rem ? `${hours}h ${rem}m` : `${hours}h`;
};

// A GitHub-style contribution grid of daily playtime for the last ~6 months.
// Today is highlighted with a ring; hovering a cell shows its date and minutes.
const RhythmCalendar = ({ series = [] }) => {
  const { weeks, monthLabels, totalMinutes, activeDays } = useMemo(() => {
    const byDate = new Map(
      series
        .filter((item) => item?.date)
        .map((item) => [String(item.date).slice(0, 10), safeNumber(item.minutes ?? item.totalMinutes)])
    );

    const today = localMidnight(0);
    const trailing = 6 - today.getDay(); // days remaining until Saturday of the current week
    const totalCells = WEEKS * 7;

    const cells = [];
    for (let index = 0; index < totalCells; index += 1) {
      const offset = totalCells - 1 - trailing - index; // oldest cell first
      const date = localMidnight(offset);
      cells.push({
        key: keyOf(date),
        date,
        minutes: byDate.get(keyOf(date)) || 0,
        isFuture: offset < 0,
        isToday: offset === 0
      });
    }

    const weeksArr = [];
    for (let week = 0; week < WEEKS; week += 1) {
      weeksArr.push(cells.slice(week * 7, week * 7 + 7));
    }

    let lastMonth = -1;
    const labels = weeksArr.map((week) => {
      const first = week[0]?.date;
      if (!first) return "";
      const month = first.getMonth();
      if (month !== lastMonth) {
        lastMonth = month;
        return MONTHS[month];
      }
      return "";
    });

    return {
      weeks: weeksArr,
      monthLabels: labels,
      totalMinutes: cells.reduce((sum, cell) => sum + (cell.isFuture ? 0 : cell.minutes), 0),
      activeDays: cells.filter((cell) => !cell.isFuture && cell.minutes > 0).length
    };
  }, [series]);

  return (
    <section className="rounded-[18px] border border-white/10 bg-[#111217] p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="eyebrow mb-2">Rhythm calendar</div>
          <h2 className="text-2xl font-black text-white">Last 6 months</h2>
        </div>
        <div className="text-sm font-semibold text-zinc-400">
          {activeDays} active days · {formatMinutesShort(totalMinutes)} tracked
        </div>
      </div>

      <div className="mt-5 overflow-x-auto">
        <div className="inline-flex min-w-full flex-col gap-2">
          <div className="flex gap-1 pl-8">
            {monthLabels.map((label, index) => (
              <div key={index} className="w-3 whitespace-nowrap text-[10px] font-bold uppercase tracking-wide text-zinc-500">
                {label}
              </div>
            ))}
          </div>

          <div className="flex gap-1">
            <div className="mr-1 flex w-7 shrink-0 flex-col gap-1">
              {WEEKDAY_LABELS.map((label, index) => (
                <div key={index} className="flex h-3 items-center text-[9px] font-bold text-zinc-600">
                  {label}
                </div>
              ))}
            </div>

            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1">
                {week.map((cell) => (
                  <div
                    key={cell.key}
                    title={cell.isFuture ? "" : `${formatDayLabel(cell.date)} — ${formatMinutesShort(cell.minutes)}`}
                    className={`h-3 w-3 rounded-[3px] ${cell.isFuture ? "bg-transparent" : LEVEL_CLASS[levelFor(cell.minutes)]} ${
                      cell.isToday ? "ring-2 ring-white ring-offset-1 ring-offset-[#111217]" : ""
                    }`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-end gap-1.5 text-[11px] font-bold text-zinc-500">
        <span className="mr-1">Less</span>
        {LEVEL_CLASS.map((cls, index) => (
          <span key={index} className={`h-3 w-3 rounded-[3px] ${cls}`} />
        ))}
        <span className="ml-1">More</span>
      </div>
    </section>
  );
};

export default RhythmCalendar;
