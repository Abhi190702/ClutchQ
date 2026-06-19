export const badgeTone = (badge = "") => {
  if (/Reliable|Communicator|Leader|Clutch/i.test(badge)) return "border-clutch-green/40 bg-clutch-green/10 text-green-200";
  if (/Mic|Night|Rank/i.test(badge)) return "border-clutch-cyan/40 bg-clutch-cyan/10 text-cyan-100";
  if (/Strategist|Flex|Support/i.test(badge)) return "border-clutch-violet/40 bg-clutch-violet/10 text-violet-100";
  return "border-clutch-border bg-clutch-panelSoft text-clutch-muted";
};

export const badgeDescription = (badge = "") => {
  const descriptions = {
    Reliable: "90+ reliability score",
    "Mic Ready": "Strong communication and mic enabled",
    "Clutch Player": "High trust from completed sessions",
    "Rank Pusher": "Actively looking for ranked progress",
    "Night Grinder": "Available in late queue windows",
    "Team Leader": "Creates and manages lobbies",
    Strategist: "High adaptability",
    "Low Toxicity": "Strong behavior history",
    "Fast Responder": "Consistent request reliability",
    "Support Main": "Comfortable in support roles",
    "Flex Pick": "Can cover multiple roles",
    Consistent: "Stable playstyle history",
    "Good Communicator": "High communication reviews"
  };

  return descriptions[badge] || "Trust signal";
};
