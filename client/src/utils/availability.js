import { DAYS } from "./constants";

export const cellKey = (cell) => `${Number(cell.day)}-${Number(cell.hour)}`;

export const hasCell = (cells = [], day, hour) => cells.some((cell) => Number(cell.day) === Number(day) && Number(cell.hour) === Number(hour));

export const toggleCell = (cells = [], day, hour) => {
  if (hasCell(cells, day, hour)) {
    return cells.filter((cell) => !(Number(cell.day) === Number(day) && Number(cell.hour) === Number(hour)));
  }

  return [...cells, { day, hour }];
};

export const overlapCells = (first = [], second = []) => {
  const secondSet = new Set(second.map(cellKey));
  return first.filter((cell) => secondSet.has(cellKey(cell)));
};

export const formatHour = (hour) => {
  if (hour === 0) return "12 AM";
  if (hour === 12) return "12 PM";
  return hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
};

export const availabilitySummary = (cells = []) => {
  if (!cells.length) return "No availability set";
  const grouped = cells.reduce((map, cell) => {
    map[cell.day] = map[cell.day] || [];
    map[cell.day].push(cell.hour);
    return map;
  }, {});
  const [day, hours] = Object.entries(grouped)[0];
  return `${DAYS[day]} ${formatHour(Math.min(...hours))} onward`;
};
