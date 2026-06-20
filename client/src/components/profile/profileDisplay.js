export const formatDate = (value) => {
  if (!value) return "Not synced yet";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
};

export const formatShortDate = (value) => {
  if (!value) return "No date";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(value));
};

export const formatMinutes = (minutes = 0) => {
  const safeMinutes = Number(minutes || 0);
  if (safeMinutes < 60) return `${safeMinutes}m`;
  const hours = Math.floor(safeMinutes / 60);
  const rest = safeMinutes % 60;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
};

export const formatHours = (minutes = 0) => {
  const hours = Math.round((Number(minutes || 0) / 60) * 10) / 10;
  return `${hours.toLocaleString()}h`;
};

export const getGameImage = (game) => game?.logoUrl || game?.iconUrl || game?.image || "";

export const getInitials = (name = "Player") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "CQ";

export const providerStatusLabel = (status) => {
  const map = {
    connected: "Connected",
    not_connected: "Not connected",
    coming_soon: "Coming soon",
    manual_soon: "Manual soon"
  };
  return map[status] || status || "Not connected";
};

export const providerStatusClass = (status) => {
  if (status === "connected") return "border-clutch-green/30 bg-clutch-green/10 text-emerald-200";
  if (status === "coming_soon" || status === "manual_soon") return "border-clutch-border bg-clutch-panelSoft text-clutch-muted";
  return "border-clutch-border bg-transparent text-clutch-muted";
};
