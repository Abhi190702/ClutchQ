import { DAYS, HOURS } from "../../utils/constants";
import { formatHour, hasCell, toggleCell } from "../../utils/availability";

const AvailabilityHeatmap = ({ value = [], onChange, readonly = false, compact = false, overlap = [] }) => {
  const overlapSet = new Set(overlap.map((cell) => `${cell.day}-${cell.hour}`));

  const handleToggle = (day, hour) => {
    if (readonly) return;
    onChange?.(toggleCell(value, day, hour));
  };

  return (
    <div className="thin-scrollbar overflow-x-auto">
      <div className={`grid min-w-[780px] gap-1 ${compact ? "text-[10px]" : "text-xs"}`} style={{ gridTemplateColumns: "44px repeat(24, minmax(22px, 1fr))" }}>
        <div />
        {HOURS.map((hour) => (
          <div key={hour} className="text-center text-[10px] text-clutch-muted" title={formatHour(hour)}>
            {hour}
          </div>
        ))}
        {DAYS.map((dayLabel, day) => (
          <div key={dayLabel} className="contents">
            <div className="flex items-center text-xs font-semibold text-clutch-muted">{dayLabel}</div>
            {HOURS.map((hour) => {
              const selected = hasCell(value, day, hour);
              const isOverlap = overlapSet.has(`${day}-${hour}`);
              return (
                <button
                  key={`${day}-${hour}`}
                  type="button"
                  title={`${dayLabel} ${formatHour(hour)}`}
                  onClick={() => handleToggle(day, hour)}
                  className={`h-7 rounded border transition ${
                    isOverlap
                      ? "border-clutch-green bg-clutch-green/50"
                      : selected
                        ? "border-clutch-cyan bg-clutch-cyan/35"
                        : "border-clutch-border bg-clutch-panelSoft hover:border-clutch-cyan/40"
                  }`}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AvailabilityHeatmap;
