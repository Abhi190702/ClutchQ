const topAvailabilityHour = (availability = []) => {
  const nightCells = availability.filter((cell) => Number(cell.hour) >= 22 || Number(cell.hour) <= 2);
  return nightCells.length;
};

export const generateBadges = ({ profile, reviews = [], reportCount = 0 } = {}) => {
  const badges = new Set();
  const ratings = profile?.averageRatings || {};
  const primaryGame = profile?.games?.find((game) => game.isPrimary) || profile?.games?.[0] || {};
  const roles = primaryGame.roles || [];

  if ((profile?.reliabilityScore || 0) >= 90) badges.add("Reliable");
  if (profile?.micAvailable && (ratings.communication || 0) >= 4) badges.add("Mic Ready");
  if ((profile?.trustScore || 0) >= 88 && (profile?.completedSessions || 0) >= 8) badges.add("Clutch Player");
  if (profile?.lookingFor?.includes("Rank Push")) badges.add("Rank Pusher");
  if (topAvailabilityHour(profile?.availability) >= 4) badges.add("Night Grinder");
  if ((profile?.createdLobbies || 0) >= 5) badges.add("Team Leader");
  if ((profile?.playstyleStats?.adaptability || 0) >= 80) badges.add("Strategist");
  if ((ratings.behavior || 0) >= 4.5 && reportCount <= 1) badges.add("Low Toxicity");
  if ((profile?.reliabilityScore || 0) >= 86 && (profile?.totalReviews || 0) >= 2) badges.add("Fast Responder");
  if (roles.some((role) => ["Support", "Controller", "Sentinel"].includes(role))) badges.add("Support Main");
  if (roles.length >= 3) badges.add("Flex Pick");
  if ((profile?.playstyleStats?.consistency || 0) >= 80) badges.add("Consistent");
  if ((ratings.communication || 0) >= 4.5) badges.add("Good Communicator");

  return [...badges];
};

export default generateBadges;
