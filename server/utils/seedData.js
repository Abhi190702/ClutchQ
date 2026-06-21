export const gamerNames = [
  "RogueRohan",
  "PixelAarav",
  "ClutchKabir",
  "NeonNisha",
  "FragDev",
  "TacticalTanya",
  "NovaAryan",
  "ViperVed",
  "SpectreSahil",
  "AimAnanya",
  "GhostIshan",
  "BlazeMeera",
  "FrostKunal",
  "OrbitOm",
  "RiftRiya",
  "PulsePranav",
  "ShadowSamar",
  "VenomVikram",
  "SageSanya",
  "CipherDev",
  "ReynaRudra",
  "JettJiya",
  "PhoenixParth",
  "OmenOmkar",
  "KilljoyKriti",
  "HarborHarsh",
  "FadeFarhan",
  "SkyeSrishti",
  "YoruYash",
  "BreachBhavya",
  "OrbitIra",
  "MetaManav",
  "DashDiya",
  "ScopeSamar",
  "ByteBhumi",
  "EchoEshan",
  "HexHarini",
  "KovaKartik",
  "NovaNaina",
  "PrismPrisha",
  "DriftDhruv",
  "AstraAnvi",
  "QuartzQadir",
  "BoltBani",
  "FlickFarah",
  "GlitchGaurav",
  "ZenZoya",
  "MatrixMira",
  "CometChirag",
  "ArcAditi",
  "VectorVivaan",
  "SparkSara",
  "TalonTara",
  "IonIshika",
  "KiteKabya",
  "MavenMoksh"
];

export const games = [
  "Valorant",
  "CS2",
  "BGMI",
  "Apex Legends",
  "Fortnite",
  "Call of Duty",
  "Dota 2",
  "League of Legends",
  "Rocket League",
  "Minecraft"
];

export const regions = ["India", "SEA", "EU", "NA", "Middle East"];
export const countries = ["India", "Singapore", "Germany", "United States", "UAE", "France", "Spain"];
export const languages = ["English", "Hindi", "Tamil", "Telugu", "Bengali", "Marathi", "Spanish", "French", "German", "Arabic"];
export const roles = ["Duelist", "Controller", "Initiator", "Sentinel", "Flex", "Support", "IGL", "Sniper", "Entry", "Anchor"];
export const lookingForTags = ["Rank Push", "Competitive", "Mic Only", "Chill Stack", "Scrim", "Tournament", "Late Night", "No Toxicity"];
export const playstyles = ["Aggressive", "Balanced", "Defensive", "Supportive", "Shotcaller", "Lurker"];
export const ranks = [
  "Silver 2",
  "Silver 3",
  "Gold 1",
  "Gold 2",
  "Gold 3",
  "Platinum 1",
  "Platinum 2",
  "Platinum 3",
  "Diamond 1",
  "Diamond 2"
];

export const demoAccounts = [
  {
    key: "demo",
    name: "Abhijeet",
    email: "demo@clutchq.com",
    role: ["Duelist", "Flex"],
    mainGame: "Valorant",
    rank: "Gold 2",
    rankValue: 11,
    trustScore: 91,
    reliabilityScore: 94,
    bio: "Gold Duelist looking for coordinated ranked stacks with clean comms and late-night consistency.",
    playstyle: "Aggressive",
    discordTag: "abhijeet#1907"
  },
  {
    key: "captain",
    name: "CaptainRex",
    email: "captain@clutchq.com",
    role: ["Controller", "IGL"],
    mainGame: "Valorant",
    rank: "Platinum 1",
    rankValue: 13,
    trustScore: 94,
    reliabilityScore: 96,
    bio: "Controller and shotcaller for ranked stacks that need calm mid-round calls.",
    playstyle: "Shotcaller",
    discordTag: "captainrex#2040"
  },
  {
    key: "sentinel",
    name: "NovaSentinel",
    email: "sentinel@clutchq.com",
    role: ["Sentinel", "Support"],
    mainGame: "Valorant",
    rank: "Gold 3",
    rankValue: 12,
    trustScore: 89,
    reliabilityScore: 91,
    bio: "Sentinel main who anchors sites, keeps utility clean, and prefers patient ranked games.",
    playstyle: "Defensive",
    discordTag: "novasentinel#3312"
  },
  {
    key: "flex",
    name: "FlexByte",
    email: "flex@clutchq.com",
    role: ["Initiator", "Flex"],
    mainGame: "CS2",
    rank: "Gold 1",
    rankValue: 10,
    trustScore: 86,
    reliabilityScore: 88,
    bio: "Flex player for CS2 and Valorant who fills utility roles and keeps comms short.",
    playstyle: "Balanced",
    discordTag: "flexbyte#8110"
  }
];

export const pick = (items, index, offset = 0) => items[(index + offset) % items.length];

export const makeAvailability = (index, strongDemoWindow = false) => {
  const cells = [];
  const baseHours = strongDemoWindow ? [20, 21, 22, 23] : [18 + (index % 5), 19 + (index % 4), 21 + (index % 3)];
  const days = strongDemoWindow ? [1, 2, 3, 4, 5, 6] : [index % 7, (index + 2) % 7, (index + 4) % 7, (index + 5) % 7];

  days.forEach((day) => {
    baseHours.forEach((hour) => {
      cells.push({ day, hour: hour % 24 });
    });
  });

  return cells;
};

export const makePlaystyleStats = (index, profileType = "balanced") => {
  const presets = {
    aggressive: {
      aggression: 86,
      support: 48,
      communication: 78,
      consistency: 76,
      adaptability: 72
    },
    support: {
      aggression: 48,
      support: 88,
      communication: 86,
      consistency: 82,
      adaptability: 78
    },
    balanced: {
      aggression: 68,
      support: 70,
      communication: 76,
      consistency: 78,
      adaptability: 75
    }
  };

  const base = presets[profileType] || presets.balanced;
  return Object.fromEntries(
    Object.entries(base).map(([key, value], statIndex) => [key, Math.max(35, Math.min(96, value + ((index + statIndex) % 9) - 4))])
  );
};

export const createDemoProfile = (userId, account = demoAccounts[0], index = 0) => ({
  userId,
  displayName: account.name,
  bio: account.bio,
  region: "India",
  country: "India",
  languages: ["Hindi", "English"],
  micAvailable: true,
  discordTag: account.discordTag,
  lookingFor: ["Rank Push", "Competitive", "Mic Only", "No Toxicity"],
  games: [
    {
      gameName: account.mainGame,
      rank: account.rank,
      rankValue: account.rankValue,
      roles: account.role,
      playstyle: account.playstyle,
      isPrimary: true
    },
    {
      gameName: account.mainGame === "CS2" ? "Valorant" : "CS2",
      rank: account.mainGame === "CS2" ? "Gold 2" : "Gold 1",
      rankValue: 10,
      roles: account.role.includes("Duelist") ? ["Entry", "Flex"] : ["Support", "Flex"],
      playstyle: "Balanced",
      isPrimary: false
    }
  ],
  availability: makeAvailability(index, true),
  playstyleStats: makePlaystyleStats(index, account.playstyle === "Aggressive" ? "aggressive" : account.role.includes("Support") ? "support" : "balanced"),
  trustScore: account.trustScore,
  reliabilityScore: account.reliabilityScore,
  totalReviews: 8,
  completedSessions: 18 + index * 3,
  noShows: 0,
  createdLobbies: 3 + index,
  validReports: 0,
  averageRatings: {
    communication: 4.6 + index * 0.05,
    teamwork: 4.5 + index * 0.04,
    skill: 4.4 + index * 0.03,
    punctuality: 4.7 + index * 0.04,
    behavior: 4.8
  },
  badges: ["Reliable", "Mic Ready", "Rank Pusher", "Night Grinder", "Clutch Player", "Good Communicator"],
  profileCompleteness: 100
});

export const createProfilePayload = (userId, name, index) => {
  const strongMatch = index < 14;
  const gameName = strongMatch ? "Valorant" : pick(games, index);
  const roleSet = strongMatch
    ? [[["Controller", "Support"], ["Initiator", "Flex"], ["Sentinel", "Support"], ["Duelist", "Entry"], ["Flex", "IGL"]][index % 5]]
    : [[pick(roles, index), pick(roles, index, 3)]];
  const selectedRoles = roleSet.flat();
  const rank = strongMatch ? pick(["Gold 1", "Gold 2", "Gold 3", "Platinum 1"], index) : pick(ranks, index);
  const region = strongMatch ? "India" : pick(regions, index);
  const languageA = strongMatch ? "Hindi" : pick(languages, index);
  const languageB = strongMatch ? "English" : pick(languages, index, 2);
  const profileType = selectedRoles.includes("Duelist") ? "aggressive" : selectedRoles.includes("Support") ? "support" : "balanced";

  return {
    userId,
    displayName: name,
    bio: `${name} queues ${gameName} with ${selectedRoles.join("/")} comfort picks and prefers structured squad comms.`,
    region,
    country: region === "India" ? "India" : pick(countries, index),
    languages: [...new Set([languageA, languageB])],
    micAvailable: index % 5 !== 0,
    discordTag: `${name.toLowerCase()}#${1000 + index}`,
    lookingFor: [pick(lookingForTags, index), pick(lookingForTags, index, 3), strongMatch ? "Rank Push" : pick(lookingForTags, index, 5)],
    games: [
      {
        gameName,
        rank,
        rankValue: 9 + (index % 9),
        roles: selectedRoles,
        playstyle: pick(playstyles, index),
        isPrimary: true
      }
    ],
    availability: makeAvailability(index, strongMatch),
    playstyleStats: makePlaystyleStats(index, profileType),
    trustScore: 70 + (index % 27),
    reliabilityScore: 72 + (index % 25),
    totalReviews: 2 + (index % 9),
    completedSessions: 4 + (index % 18),
    noShows: index % 13 === 0 ? 2 : index % 7 === 0 ? 1 : 0,
    createdLobbies: index % 9,
    validReports: index % 17 === 0 ? 1 : 0,
    averageRatings: {
      communication: Number((3.6 + (index % 13) * 0.1).toFixed(1)),
      teamwork: Number((3.7 + (index % 10) * 0.12).toFixed(1)),
      skill: Number((3.5 + (index % 11) * 0.11).toFixed(1)),
      punctuality: Number((3.8 + (index % 9) * 0.1).toFixed(1)),
      behavior: Number((3.9 + (index % 8) * 0.11).toFixed(1))
    },
    badges: [],
    profileCompleteness: strongMatch ? 100 : 78 + (index % 20)
  };
};
