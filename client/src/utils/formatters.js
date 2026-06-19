export const percent = (value) => `${Math.round(value || 0)}%`;

export const shortDateTime = (value) => {
  if (!value) return "Tonight";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
};

export const initials = (name = "CQ") =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export const plural = (count, singular, pluralLabel = `${singular}s`) => `${count} ${count === 1 ? singular : pluralLabel}`;
