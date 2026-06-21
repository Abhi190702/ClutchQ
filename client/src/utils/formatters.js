export const safeText = (value, fallback = "Not available") => {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
};

export const formatNumber = (value, fallback = "0") => {
  const number = Number(value);
  if (Number.isNaN(number)) return fallback;
  return new Intl.NumberFormat().format(number);
};

export const formatPercentage = (value, fallback = "0%") => {
  const number = Number(value);
  if (Number.isNaN(number)) return fallback;
  return `${Math.round(number)}%`;
};

export const percent = formatPercentage;

export const formatRating = (value, fallback = "Unrated") => {
  if (value === null || value === undefined || value === "") return fallback;
  const number = Number(value);
  if (Number.isNaN(number)) return fallback;
  return Number.isInteger(number) ? String(number) : number.toFixed(1);
};

export const shortDateTime = (value) => {
  if (!value) return "Starts when full";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Starts when full";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
};

export const formatDate = (value, fallback = "Not synced yet") => {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(date);
};

export const formatShortDate = (value, fallback = "No date") => {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(date);
};

export const formatSafeDate = formatDate;
export const formatSafeDateTime = (value, fallback = "Not available") => {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
};

export const formatMinutes = (minutes = 0) => {
  const safeMinutes = Math.max(0, Math.round(Number(minutes || 0)));
  if (safeMinutes < 60) return `${safeMinutes}m`;
  const hours = Math.floor(safeMinutes / 60);
  const rest = safeMinutes % 60;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
};

export const formatHours = (minutes = 0) => {
  const hours = Math.round((Math.max(0, Number(minutes || 0)) / 60) * 10) / 10;
  return `${hours.toLocaleString()}h`;
};

export const formatPlaytime = formatHours;

export const getInitials = (name = "CQ") =>
  String(name || "CQ")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "CQ";

export const initials = getInitials;

export const plural = (count, singular, pluralLabel = `${singular}s`) => `${count} ${count === 1 ? singular : pluralLabel}`;
