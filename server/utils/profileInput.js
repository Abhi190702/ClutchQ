import { normalizeGameRank } from "./rankLogic.js";
import { booleanInput, cleanTextInput, numberInput } from "./inputValue.js";

const playstyleKeys = ["aggression", "support", "communication", "consistency", "adaptability"];

const cleanText = cleanTextInput;

const cleanList = (value, { maxItems, maxLength }) => {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((item) => cleanText(item, maxLength)).filter(Boolean))].slice(0, maxItems);
};

const cleanGames = (value) => {
  if (!Array.isArray(value)) return [];

  const games = value
    .slice(0, 12)
    .map((game) => ({
      gameName: cleanText(game?.gameName, 100),
      rank: cleanText(game?.rank, 50),
      roles: cleanList(game?.roles, { maxItems: 8, maxLength: 50 }),
      playstyle: cleanText(game?.playstyle, 60),
      isPrimary: booleanInput(game?.isPrimary)
    }))
    .filter((game) => game.gameName)
    .map(normalizeGameRank);

  if (games.length && !games.some((game) => game.isPrimary)) games[0].isPrimary = true;
  let primarySeen = false;
  games.forEach((game) => {
    if (!game.isPrimary) return;
    if (primarySeen) game.isPrimary = false;
    primarySeen = true;
  });

  return games;
};

const cleanAvailability = (value) => {
  if (!Array.isArray(value)) return [];
  const unique = new Map();

  value.slice(0, 336).forEach((cell) => {
    const day = Number(cell?.day);
    const hour = Number(cell?.hour);
    if (!Number.isInteger(day) || day < 0 || day > 6 || !Number.isInteger(hour) || hour < 0 || hour > 23) return;
    unique.set(`${day}:${hour}`, { day, hour });
  });

  return [...unique.values()].slice(0, 168);
};

const cleanPlaystyle = (value) => {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  return playstyleKeys.reduce((output, key) => {
    if (!Object.hasOwn(source, key)) return output;
    const number = numberInput(source[key]);
    if (number !== undefined) output[key] = Math.max(0, Math.min(100, Math.round(number)));
    return output;
  }, {});
};

export const sanitizeProfileUpdate = (body = {}) => {
  const output = {};

  if (Object.hasOwn(body, "displayName")) output.displayName = cleanText(body.displayName, 60);
  if (Object.hasOwn(body, "bio")) output.bio = cleanText(body.bio, 500);
  if (Object.hasOwn(body, "region")) output.region = cleanText(body.region, 80);
  if (Object.hasOwn(body, "country")) output.country = cleanText(body.country, 80);
  if (Object.hasOwn(body, "languages")) output.languages = cleanList(body.languages, { maxItems: 8, maxLength: 40 });
  if (Object.hasOwn(body, "micAvailable")) output.micAvailable = booleanInput(body.micAvailable);
  if (Object.hasOwn(body, "discordTag")) output.discordTag = cleanText(body.discordTag, 80);
  if (Object.hasOwn(body, "lookingFor")) output.lookingFor = cleanList(body.lookingFor, { maxItems: 12, maxLength: 60 });
  if (Object.hasOwn(body, "games")) output.games = cleanGames(body.games);
  if (Object.hasOwn(body, "availability")) output.availability = cleanAvailability(body.availability);
  if (Object.hasOwn(body, "playstyleStats")) output.playstyleStats = cleanPlaystyle(body.playstyleStats);

  return output;
};
