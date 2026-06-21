export const getGameImage = (game) => game?.logoUrl || game?.iconUrl || game?.image || "";

export const providerDisplayName = (provider) => {
  const map = {
    google: "Google",
    discord: "Discord",
    steam: "Steam",
    epic: "Epic Games",
    microsoft: "Microsoft",
    playstation: "PlayStation Network",
    xbox: "Xbox Network",
    nintendo: "Nintendo Account"
  };
  return map[provider] || provider || "Platform";
};

export const providerStatusLabel = (status) => {
  const map = {
    connected: "Connected",
    not_connected: "Not connected",
    coming_soon: "Coming soon",
    manual_soon: "Manual soon"
  };
  return map[status] || status || "Not connected";
};

export const providerStatusTone = (status) => {
  if (status === "connected") return "success";
  if (status === "coming_soon" || status === "manual_soon") return "warning";
  return "default";
};

export const providerStatusClass = (status) => {
  if (status === "connected") return "border-clutch-green/30 bg-clutch-green/10 text-emerald-200";
  if (status === "coming_soon" || status === "manual_soon") return "border-clutch-border bg-clutch-panelSoft text-clutch-muted";
  return "border-clutch-border bg-transparent text-clutch-muted";
};
