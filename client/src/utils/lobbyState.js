export const fitLabel = (score) => {
  if (score >= 88) return "Great fit";
  if (score >= 72) return "Good fit";
  if (score >= 55) return "Partial fit";
  return "Low fit";
};

const getMemberCount = (lobby) => {
  if (!Array.isArray(lobby?.currentMembers)) return 0;
  return lobby.currentMembers.filter((member) => member?.status !== "left").length;
};

export const getLobbyState = (lobby = {}, compatibility = null) => {
  const maxPlayers = Number(lobby.maxPlayers || lobby.neededPlayers || 5);
  const memberCount = getMemberCount(lobby);
  const openSlots = Math.max(0, maxPlayers - memberCount);
  const isClosed = lobby.status === "closed";
  const isFull = openSlots <= 0 || lobby.status === "full";
  const isOpen = lobby.status === "open" || (!lobby.status && !isClosed && !isFull);
  const canRequest = isOpen && !isClosed && !isFull;
  const rawScore = compatibility?.score;
  const hasScore = rawScore !== null && rawScore !== undefined && Number.isFinite(Number(rawScore));
  const score = hasScore ? Math.round(Number(rawScore)) : null;

  return {
    maxPlayers,
    memberCount,
    openSlots,
    isClosed,
    isFull,
    isOpen,
    canRequest,
    score,
    hasScore,
    scoreLabel: hasScore ? `${score}%` : "--",
    fitLabel: hasScore ? fitLabel(score) : "No data",
    joinLabel: isClosed ? "Closed" : isFull ? "Full" : "Request Join",
    disabledTitle: isFull ? "This lobby is already full." : isClosed ? "This lobby is closed." : undefined
  };
};
