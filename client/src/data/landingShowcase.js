import { getGameArt } from "../utils/gameArt";

export const featuredGames = [
  {
    title: "Valorant",
    slug: "valorant",
    image: getGameArt("Valorant"),
    genre: "Tactical FPS",
    squadLine: "Gold-Plat ranked stacks forming tonight",
    roleNeeded: "Controller",
    rankRange: "Gold II - Platinum I",
    onlineCount: 128,
    fitScore: 92,
    accent: "#ff4655"
  },
  {
    title: "Counter-Strike 2",
    slug: "counter-strike-2",
    image: getGameArt("Counter-Strike 2"),
    genre: "Competitive FPS",
    squadLine: "Premier teams looking for calm comms",
    roleNeeded: "Anchor",
    rankRange: "8K - 13K",
    onlineCount: 96,
    fitScore: 88,
    accent: "#f59e0b"
  },
  {
    title: "Fortnite",
    slug: "fortnite",
    image: getGameArt("Fortnite"),
    genre: "Battle Royale",
    squadLine: "Zero Build squads with voice ready",
    roleNeeded: "IGL",
    rankRange: "Gold - Diamond",
    onlineCount: 144,
    fitScore: 89,
    accent: "#22d3ee"
  },
  {
    title: "Apex Legends",
    slug: "apex-legends",
    image: getGameArt("Apex Legends"),
    genre: "Hero BR",
    squadLine: "Rank push trios needing support mains",
    roleNeeded: "Support",
    rankRange: "Silver - Platinum",
    onlineCount: 74,
    fitScore: 86,
    accent: "#ef4444"
  },
  {
    title: "Minecraft",
    slug: "minecraft",
    image: getGameArt("Minecraft"),
    genre: "Sandbox",
    squadLine: "Late-night survival crews and realm teams",
    roleNeeded: "Builder",
    rankRange: "Casual",
    onlineCount: 52,
    fitScore: 82,
    accent: "#22c55e"
  },
  {
    title: "BGMI",
    slug: "bgmi",
    image: getGameArt("BGMI"),
    genre: "Mobile BR",
    squadLine: "India squads looking for disciplined rotations",
    roleNeeded: "Scout",
    rankRange: "Crown - Ace",
    onlineCount: 112,
    fitScore: 90,
    accent: "#f97316"
  }
];

export const squadQueues = [
  {
    title: "Night ranked stack",
    game: "Valorant",
    slug: "valorant",
    image: getGameArt("Valorant"),
    roleNeeded: "Controller",
    rankRange: "Gold II - Plat I",
    onlineCount: 31,
    fitScore: 91,
    tag: "Voice ready"
  },
  {
    title: "Premier calm comms",
    game: "Counter-Strike 2",
    slug: "counter-strike-2",
    image: getGameArt("Counter-Strike 2"),
    roleNeeded: "Anchor",
    rankRange: "8K - 13K",
    onlineCount: 18,
    fitScore: 88,
    tag: "Low tilt"
  },
  {
    title: "Zero Build squad",
    game: "Fortnite",
    slug: "fortnite",
    image: getGameArt("Fortnite"),
    roleNeeded: "IGL",
    rankRange: "Gold - Diamond",
    onlineCount: 27,
    fitScore: 89,
    tag: "Fast queue"
  },
  {
    title: "Crown push lobby",
    game: "BGMI",
    slug: "bgmi",
    image: getGameArt("BGMI"),
    roleNeeded: "Scout",
    rankRange: "Crown - Ace",
    onlineCount: 22,
    fitScore: 90,
    tag: "India"
  },
  {
    title: "Rocket rotation duo",
    game: "Rocket League",
    slug: "rocket-league",
    image: getGameArt("Rocket League"),
    roleNeeded: "Second man",
    rankRange: "Diamond",
    onlineCount: 14,
    fitScore: 84,
    tag: "2v2"
  }
];

export const discoveryRows = [
  {
    label: "Trending squad games",
    games: ["Valorant", "Counter-Strike 2", "Fortnite", "Apex Legends", "BGMI", "Rocket League"]
  },
  {
    label: "Competitive stacks",
    games: ["Valorant", "Counter-Strike 2", "League of Legends", "Mobile Legends", "Clash Royale", "EA FC"]
  },
  {
    label: "Co-op chaos",
    games: ["Minecraft", "Lethal Company", "Phasmophobia", "Helldivers 2", "Roblox", "Fall Guys"]
  },
  {
    label: "Cafe favorites",
    games: ["BGMI", "Free Fire", "GTA Online", "Rocket League", "Trackmania", "F1"]
  }
];

export const cafeFindings = [
  "Multiple Steam IDs across shared setups",
  "Many Discord IDs and no common identity",
  "Good teammates are hard to find again",
  "Cafe owners need better session memory",
  "Players liked unified squad profiles"
];

export const cafeImages = [
  "/field/otg-interior.jpg",
  "/field/otg-exterior.jpg",
  "/field/otg-map.jpg"
];

export const gameplaySignals = [
  { label: "Team support", value: 88 },
  { label: "Pressure handling", value: 81 },
  { label: "Entry pressure", value: 76 },
  { label: "Objective focus", value: 72 }
];
