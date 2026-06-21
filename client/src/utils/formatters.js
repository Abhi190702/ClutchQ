export const safeText = (value, fallback = "Not available") => {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
};

export const safeNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

export const formatNumber = (value, fallback = "0") => {
  const number = safeNumber(value, NaN);
  if (Number.isNaN(number)) return fallback;
  return new Intl.NumberFormat().format(number);
};

export const formatPercentage = (value, fallback = "-") => {
  const number = safeNumber(value, NaN);
  if (Number.isNaN(number)) return fallback;
  return `${Math.round(number)}%`;
};

export const percent = formatPercentage;

export const formatRating = (value, fallback = "Unrated") => {
  if (value === null || value === undefined || value === "") return fallback;
  const number = safeNumber(value, NaN);
  if (Number.isNaN(number)) return fallback;
  return Number.isInteger(number) ? String(number) : number.toFixed(1);
};

const getDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const shortDateTime = (value, fallback = "Not available") => {
  const date = getDate(value);
  if (!date) return fallback;
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
};

export const formatDate = (value, fallback = "Not available") => {
  const date = getDate(value);
  if (!date) return fallback;
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(date);
};

export const formatShortDate = (value, fallback = "Not available") => {
  const date = getDate(value);
  if (!date) return fallback;
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(date);
};

export const formatSafeDate = formatDate;
export const formatSafeDateTime = (value, fallback = "Not available") => {
  const date = getDate(value);
  if (!date) return fallback;
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
};

export const formatMinutes = (minutes, fallback = "0m") => {
  const numeric = safeNumber(minutes, NaN);
  if (Number.isNaN(numeric)) return fallback;
  const safeMinutes = Math.max(0, Math.round(numeric));
  if (safeMinutes < 60) return `${safeMinutes}m`;
  const hours = Math.floor(safeMinutes / 60);
  const rest = safeMinutes % 60;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
};

export const formatHours = (minutes, fallback = "0h") => {
  const numeric = safeNumber(minutes, NaN);
  if (Number.isNaN(numeric)) return fallback;
  const hours = Math.round((Math.max(0, numeric) / 60) * 10) / 10;
  return `${hours.toLocaleString()}h`;
};

export const formatPlaytime = (minutes, fallback = "0m") => {
  const numeric = safeNumber(minutes, NaN);
  if (Number.isNaN(numeric)) return fallback;
  return numeric >= 60 ? formatHours(numeric, fallback) : formatMinutes(numeric, fallback);
};

export const initials = (name, fallback = "CQ") =>
  String(name || fallback)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || fallback;

export const getInitials = initials;

export const plural = (count, singular, pluralLabel = `${singular}s`) => `${count} ${count === 1 ? singular : pluralLabel}`;
