const hostNames = ["AstraQueue", "RankedRishi", "NovaStack", "MiraComms", "ClutchCaptain", "PixelPilot"];
const regions = ["India", "SEA", "Middle East", "EU"];
const languages = ["English", "Hindi", "English", "English"];
const rankBands = [
  ["Silver 2", "Gold 3"],
  ["Gold 1", "Platinum 2"],
  ["Platinum 1", "Diamond 2"],
  ["Any", "Any"]
];

const modeLabels = ["Ranked Push", "Open Lobby", "Mic Required", "Casual Chill", "Beginner Friendly"];

const member = (game, seed, index) => ({
  userId: {
    _id: `preview-user-${game.slug}-${seed}-${index}`,
    name: ["Abhijeet", "Kira", "Dev", "Sam", "Zoya", "Arjun"][index % 6],
    avatar: "/clutchq-logo.svg"
  },
  role: game.roles?.[(seed + index) % (game.roles?.length || 1)] || "Flex",
  joinedAt: new Date(Date.now() - (seed + index + 1) * 8 * 60000),
  ready: index % 2 === 0,
  status: "joined"
});

export const buildDemoRooms = (game, count = 4) => {
  if (!game) return [];

  return Array.from({ length: count }, (_, index) => {
    const currentCount = Math.min(Math.max(2, (index % 3) + 2), game.teamSize || 5);
    const mode = game.supportedModes?.[index % (game.supportedModes?.length || 1)] || modeLabels[index % modeLabels.length];
    const [rankMin, rankMax] = rankBands[index % rankBands.length];

    return {
      _id: `preview-${game.slug}-${index + 1}`,
      isPreview: true,
      gameSlug: game.slug,
      title: `${game.title} ${modeLabels[index % modeLabels.length]}`,
      hostId: {
        _id: `preview-host-${game.slug}-${index + 1}`,
        name: hostNames[index % hostNames.length],
        avatar: "/clutchq-logo.svg"
      },
      mode,
      region: regions[index % regions.length],
      language: languages[index % languages.length],
      rankMin,
      rankMax,
      micRequired: index !== 3,
      maxMembers: game.teamSize || 5,
      currentMembers: Array.from({ length: currentCount }, (_, memberIndex) => member(game, index, memberIndex)),
      neededRoles: (game.roles || ["Flex"]).slice(index % 2, Math.min((index % 2) + 3, game.roles?.length || 1)),
      tags: ["Demo Ready", modeLabels[index % modeLabels.length], game.category].filter(Boolean),
      status: index === 2 ? "starting" : "open",
      trustRequirement: 60 + index * 5,
      startsAt: new Date(Date.now() + (index + 1) * 12 * 60000),
      createdAt: new Date(Date.now() - (index + 1) * 18 * 60000),
      updatedAt: new Date(),
      discord: index === 0 ? { channelName: `${game.title} Voice`, createdAt: new Date() } : undefined
    };
  });
};

export const countDemoRoomPlayers = (rooms = []) =>
  rooms.reduce((sum, room) => sum + (room.currentMembers?.filter((item) => item.status !== "left").length || 0), 0);
