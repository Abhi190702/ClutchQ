const now = Date.now();
const daysAgo = (days) => new Date(now - days * 24 * 60 * 60 * 1000);

export const demoSteamIdentity = {
  connected: true,
  demo: true,
  steamId: "76561199000072910",
  displayName: "Abhijeet",
  avatar: "/clutchq-logo.svg",
  profileUrl: "https://steamcommunity.com/id/clutchq-demo",
  level: 42,
  lastSyncedAt: new Date().toISOString(),
  privacyStatus: "Demo Steam profile"
};

export const demoSteamGames = [
  { appId: 730, name: "Counter-Strike 2", iconUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/730/header.jpg", playtimeForeverMinutes: 12640, playtimeLastTwoWeeksMinutes: 520, lastPlayedAt: daysAgo(1), hasCommunityVisibleStats: true },
  { appId: 1172470, name: "Apex Legends", iconUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/1172470/header.jpg", playtimeForeverMinutes: 6420, playtimeLastTwoWeeksMinutes: 190, lastPlayedAt: daysAgo(3), hasCommunityVisibleStats: true },
  { appId: 1966720, name: "Lethal Company", iconUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/1966720/header.jpg", playtimeForeverMinutes: 2160, playtimeLastTwoWeeksMinutes: 310, lastPlayedAt: daysAgo(2), hasCommunityVisibleStats: true },
  { appId: 553850, name: "Helldivers 2", iconUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/553850/header.jpg", playtimeForeverMinutes: 1840, playtimeLastTwoWeeksMinutes: 120, lastPlayedAt: daysAgo(5), hasCommunityVisibleStats: true },
  { appId: 945360, name: "Among Us", iconUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/945360/header.jpg", playtimeForeverMinutes: 910, playtimeLastTwoWeeksMinutes: 45, lastPlayedAt: daysAgo(9), hasCommunityVisibleStats: true },
  { appId: 413150, name: "Stardew Valley", iconUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/413150/header.jpg", playtimeForeverMinutes: 1240, playtimeLastTwoWeeksMinutes: 0, lastPlayedAt: daysAgo(48), hasCommunityVisibleStats: true }
];

export const demoSteamAchievements = [
  { appId: 730, gameName: "Counter-Strike 2", displayName: "Clutch Round", description: "Won a tense final round", achieved: true, unlockTime: daysAgo(2), rarityPercent: 8.4 },
  { appId: 730, gameName: "Counter-Strike 2", displayName: "Utility Master", description: "Won with clean team utility", achieved: true, unlockTime: daysAgo(5), rarityPercent: 14.1 },
  { appId: 1966720, gameName: "Lethal Company", displayName: "Quota Cleared", description: "Completed a profitable run", achieved: true, unlockTime: daysAgo(1), rarityPercent: 21.9 },
  { appId: 553850, gameName: "Helldivers 2", displayName: "Clean Extract", description: "Completed extraction with the squad", achieved: true, unlockTime: daysAgo(4), rarityPercent: 18.3 },
  { appId: 1172470, gameName: "Apex Legends", displayName: "Final Ring", description: "Reached endgame with full squad", achieved: false, rarityPercent: 32.5 }
];

export const demoSteamFriends = [
  { friendSteamId: "76561199000000011", displayName: "NovaStack", avatar: "/clutchq-logo.svg", profileUrl: "https://steamcommunity.com/id/novastack", friendSince: daysAgo(500), onClutchQ: true },
  { friendSteamId: "76561199000000012", displayName: "RankedRishi", avatar: "/clutchq-logo.svg", profileUrl: "https://steamcommunity.com/id/rankedrishi", friendSince: daysAgo(320), onClutchQ: true },
  { friendSteamId: "76561199000000013", displayName: "MiraComms", avatar: "/clutchq-logo.svg", profileUrl: "https://steamcommunity.com/id/miracomms", friendSince: daysAgo(210), onClutchQ: false },
  { friendSteamId: "76561199000000014", displayName: "PixelPilot", avatar: "/clutchq-logo.svg", profileUrl: "https://steamcommunity.com/id/pixelpilot", friendSince: daysAgo(90), onClutchQ: false }
];
