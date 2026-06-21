export { formatDate, formatHours, formatMinutes, formatShortDate, getInitials } from "../../utils/formatters";

export const getGameImage = (game) => game?.logoUrl || game?.iconUrl || game?.image || "";

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
