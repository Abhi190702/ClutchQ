const cellKey = (cell) => `${Number(cell.day)}-${Number(cell.hour)}`;

const sortCells = (cells) =>
  [...cells].sort((a, b) => {
    if (a.day === b.day) return a.hour - b.hour;
    return a.day - b.day;
  });

export const calculateAvailabilityOverlap = (first = [], second = []) => {
  const firstMap = new Map(first.map((cell) => [cellKey(cell), { day: Number(cell.day), hour: Number(cell.hour) }]));
  const secondMap = new Map(second.map((cell) => [cellKey(cell), { day: Number(cell.day), hour: Number(cell.hour) }]));
  const overlap = [];

  firstMap.forEach((cell, key) => {
    if (secondMap.has(key)) {
      overlap.push(cell);
    }
  });

  const overlapHours = overlap.length;
  const unionSize = new Set([...firstMap.keys(), ...secondMap.keys()]).size || 1;

  return {
    overlap: sortCells(overlap),
    overlapHours,
    firstHours: firstMap.size,
    secondHours: secondMap.size,
    overlapPercent: Math.round((overlapHours / unionSize) * 100),
    quality: overlapHours >= 3 ? "strong" : overlapHours > 0 ? "partial" : "none",
    summary:
      overlapHours >= 3
        ? `${overlapHours} shared hours. Strong queue window.`
        : overlapHours > 0
          ? `${overlapHours} shared hour${overlapHours === 1 ? "" : "s"}. Usable but limited.`
          : "No common availability yet."
  };
};

export default calculateAvailabilityOverlap;
