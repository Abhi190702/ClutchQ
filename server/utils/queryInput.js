export const boundedQueryText = (value, maxLength = 100) => {
  if (value === undefined || value === null || Array.isArray(value) || typeof value === "object") return "";
  return String(value)
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
};

export const boundedSlug = (value, maxLength = 80) =>
  boundedQueryText(value, maxLength)
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/(^-|-$)/g, "");
