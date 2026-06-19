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

export const createDemoProfile = (userId) => ({
  userId,
  displayName: "Abhijeet",
  bio: "Gold Duelist looking for coordinated ranked stacks with clean comms and late-night consistency.",
  region: "India",
  country: "India",
  languages: ["Hindi", "English"],
  micAvailable: true,
  discordTag: "abhijeet#1907",
  lookingFor: ["Rank Push", "Competitive", "Mic Only", "No Toxicity"],
  games: [
    {
      gameName: "Valorant",
      rank: "Gold 2",
      rankValue: 11,
      roles: ["Duelist", "Flex"],
      playstyle: "Aggressive",
      isPrimary: true
    }
  ],
  availability: makeAvailability(0, true),
  playstyleStats: makePlaystyleStats(0, "aggressive"),
  trustScore: 91,
  reliabilityScore: 94,
  totalReviews: 8,
  completedSessions: 16,
  noShows: 0,
  createdLobbies: 3,
  validReports: 0,
  averageRatings: {
    communication: 4.7,
    teamwork: 4.5,
    skill: 4.4,
    punctuality: 4.8,
    behavior: 4.9
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
