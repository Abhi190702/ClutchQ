export const booleanInput = (value, fallback = false) => {
  if (typeof value === "boolean") return value;
  if (value === 1 || value === "1") return true;
  if (value === 0 || value === "0") return false;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "yes", "on"].includes(normalized)) return true;
    if (["false", "no", "off", ""].includes(normalized)) return false;
  }
  return fallback;
};

export const cleanTextInput = (value, maxLength = 500) => {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
};

export const numberInput = (value, fallback = undefined) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  if (typeof value !== "string" || !value.trim()) return fallback;
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

export const dateInput = (value) => {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? undefined : new Date(value);
  if (typeof value !== "string" && typeof value !== "number") return undefined;
  if (typeof value === "string" && !value.trim()) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};
