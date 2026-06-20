export const AUTH_PROVIDERS = [
  {
    id: "psn",
    label: "PlayStation Network",
    shortLabel: "PS",
    section: "console",
    status: "manual",
    route: null,
    description: "Link PSN Online ID manually for now",
    tone: "blue",
    logoUrl: "https://cdn.simpleicons.org/playstation/FFFFFF",
    logoBg: "blue"
  },
  {
    id: "xbox",
    label: "Xbox Network",
    shortLabel: "X",
    section: "console",
    status: "stub",
    route: "/api/auth/microsoft",
    description: "Microsoft/Xbox identity coming next",
    tone: "green",
    logoUrl: "https://img.icons8.com/color/96/xbox.png",
    logoBg: "white"
  },
  {
    id: "nintendo",
    label: "Nintendo Account",
    shortLabel: "N",
    section: "console",
    status: "manual",
    route: null,
    description: "Link Nintendo handle manually for now",
    tone: "red",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/0/0d/Nintendo.svg",
    logoBg: "white"
  },
  {
    id: "google",
    label: "Google / Gmail",
    shortLabel: "G",
    section: "other",
    status: "oauth",
    route: "/api/auth/google",
    description: "Continue with Google",
    tone: "white",
    logoUrl: "https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg",
    logoBg: "white"
  },
  {
    id: "discord",
    label: "Discord",
    shortLabel: "D",
    section: "other",
    status: "oauth",
    route: "/api/auth/discord",
    description: "Continue with Discord",
    tone: "violet",
    logoUrl: "https://cdn.simpleicons.org/discord/FFFFFF",
    logoBg: "violet"
  },
  {
    id: "steam",
    label: "Steam",
    shortLabel: "S",
    section: "other",
    status: "oauth",
    route: "/api/auth/steam",
    description: "Continue with Steam",
    tone: "sky",
    logoUrl: "https://cdn.simpleicons.org/steam/FFFFFF",
    logoBg: "sky"
  },
  {
    id: "epic",
    label: "Epic Games",
    shortLabel: "E",
    section: "other",
    status: "stub",
    route: "/api/auth/epic",
    description: "Epic account connection coming next",
    tone: "dark",
    logoUrl: "https://cdn.simpleicons.org/epicgames/111113",
    logoBg: "white"
  },
  {
    id: "microsoft",
    label: "Microsoft",
    shortLabel: "M",
    section: "other",
    status: "stub",
    route: "/api/auth/microsoft",
    description: "Microsoft login coming next",
    tone: "blue",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg",
    logoBg: "white"
  },
  {
    id: "demo",
    label: "Demo Player",
    shortLabel: "CQ",
    section: "other",
    status: "demo",
    route: null,
    description: "Try ClutchQ instantly",
    tone: "cyan",
    logoUrl: "/clutchq-logo.svg",
    logoBg: "dark"
  }
];

export const getConsoleProviders = () => AUTH_PROVIDERS.filter((provider) => provider.section === "console");

export const getOtherProviders = () => AUTH_PROVIDERS.filter((provider) => provider.section === "other");

export const getProviderById = (id) => AUTH_PROVIDERS.find((provider) => provider.id === id);
