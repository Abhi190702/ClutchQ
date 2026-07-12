import test from "node:test";
import assert from "node:assert/strict";
import { createRequestId, publicDatabaseHealth } from "../utils/httpSecurity.js";
import { sanitizeProfileUpdate } from "../utils/profileInput.js";
import { sanitizeRoomForViewer } from "../utils/roomPrivacy.js";
import { buildSteamAuthUrl, getFriendList, getOwnedGames, getPlayerAchievements, verifySteamOpenId } from "../services/steamService.js";
import { assertDestructiveScriptAllowed } from "../utils/scriptSafety.js";
import User from "../models/User.js";
import {
  fallbackAnalyzeScorecard,
  fallbackBuildRhythm,
  fallbackComputeTeammateFit,
  fallbackRebuildGameplayGraph
} from "../services/fallbackAnalyticsService.js";
import { boundedQueryText, boundedSlug } from "../utils/queryInput.js";
import { isLocalDevelopment, isProductionRuntime } from "../utils/runtimeEnv.js";
import calculateTrustScore from "../utils/calculateTrustScore.js";
import calculateMatchScore from "../utils/calculateMatchScore.js";
import { verifyTurnstileToken } from "../services/turnstileService.js";
import { substantiatedReportStatuses } from "../services/reputationService.js";
import { validateEnv } from "../utils/validateEnv.js";
import { booleanInput, cleanTextInput, dateInput, numberInput } from "../utils/inputValue.js";
import app from "../app.js";
import SteamSyncLog from "../models/SteamSyncLog.js";
import { runAnalyticsTask } from "../services/analyticsWorkerService.js";
import OAuthLoginCode from "../models/OAuthLoginCode.js";
import { cleanupDiscordChannelsBeforeDelete } from "../utils/scriptDiscordCleanup.js";
import {
  acquireDiscordProvisioningLease,
  persistDiscordProvision,
  releaseDiscordProvisioningLease
} from "../services/discordProvisioningService.js";
import { isSharedDemoEmail, isSharedDemoUser } from "../utils/demoAccounts.js";
import { getLinkUserFromRequest, prepareOAuthLinkCookie } from "../controllers/authController.js";
import { calculateLobbyCompatibility } from "../controllers/matchmakingController.js";
import { getTurnstileAllowedHostnames } from "../utils/turnstileConfig.js";

test("request IDs accept a bounded safe value and replace unsafe input", () => {
  assert.equal(createRequestId("client-request_123"), "client-request_123");
  assert.match(createRequestId("bad\nheader"), /^[0-9a-f-]{36}$/i);
  assert.match(createRequestId("x".repeat(101)), /^[0-9a-f-]{36}$/i);
});

test("Express smoke test exposes safe root/health responses and rejects unknown origins", async (context) => {
  const server = await new Promise((resolve) => {
    const listener = app.listen(0, "127.0.0.1", () => resolve(listener));
  });
  context.after(() => new Promise((resolve) => server.close(resolve)));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  const root = await fetch(`${baseUrl}/`, { headers: { "x-request-id": "smoke-request" } });
  assert.equal(root.status, 200);
  assert.equal(root.headers.get("x-request-id"), "smoke-request");
  assert.equal((await root.json()).message, "ClutchQ API is live");

  const health = await fetch(`${baseUrl}/api/health`);
  assert.equal(health.status, 503);
  const healthBody = await health.json();
  assert.equal(healthBody.success, false);
  assert.equal(healthBody.data.database.state, "disconnected");

  const denied = await fetch(`${baseUrl}/`, { headers: { Origin: "https://attacker.example" } });
  assert.equal(denied.status, 403);
  assert.equal((await denied.json()).success, false);

  const scalarBody = await fetch(`${baseUrl}/api/auth/logout`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "null"
  });
  assert.equal(scalarBody.status, 400);
  assert.equal((await scalarBody.json()).message, "Request body contains invalid JSON.");

  const unsafeBody = await fetch(`${baseUrl}/api/auth/logout`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ $where: "return true" })
  });
  assert.equal(unsafeBody.status, 400);

  const nestedFormBody = await fetch(`${baseUrl}/api/auth/logout`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: "profile%5Brole%5D=admin"
  });
  assert.equal(nestedFormBody.status, 200);
  assert.deepEqual(await nestedFormBody.json(), { success: true, message: "Logged out" });

  const invalidJson = await fetch(`${baseUrl}/api/auth/logout`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{invalid"
  });
  assert.equal(invalidJson.status, 400);
  assert.equal((await invalidJson.json()).message, "Request body contains invalid JSON.");
});

test("production health output does not disclose database host or name", () => {
  const connection = { readyState: 1, host: "cluster.internal", name: "clutchq-production" };
  assert.deepEqual(publicDatabaseHealth(connection, true), { state: "connected" });
  assert.deepEqual(publicDatabaseHealth(connection, false), {
    state: "connected",
    host: "cluster.internal",
    name: "clutchq-production"
  });
});

test("profile updates reject computed-field mass assignment and normalize user input", () => {
  const result = sanitizeProfileUpdate({
    displayName: "  Player   One  ",
    trustScore: 100,
    totalReviews: 999,
    badges: ["Admin"],
    games: [
      { gameName: "Valorant", rank: "Gold 2", rankValue: 9999, roles: ["Duelist", "Duelist"], isPrimary: true },
      { gameName: "CS2", rank: "Silver", roles: ["Support"], isPrimary: true }
    ],
    availability: [{ day: 1, hour: 20 }, { day: 1, hour: 20 }, { day: 9, hour: 99 }],
    playstyleStats: { aggression: 140, support: -20, communication: 75 }
  });

  assert.equal(result.displayName, "Player One");
  assert.equal(Object.hasOwn(result, "trustScore"), false);
  assert.equal(Object.hasOwn(result, "totalReviews"), false);
  assert.equal(Object.hasOwn(result, "badges"), false);
  assert.equal(result.games[0].rankValue < 9999, true);
  assert.deepEqual(result.games[0].roles, ["Duelist"]);
  assert.equal(result.games.filter((game) => game.isPrimary).length, 1);
  assert.deepEqual(result.availability, [{ day: 1, hour: 20 }]);
  assert.equal(result.playstyleStats.aggression, 100);
  assert.equal(result.playstyleStats.support, 0);
  assert.equal(result.playstyleStats.communication, 75);
  assert.equal(result.playstyleStats.consistency, undefined);
});

test("text inputs reject nested JSON instead of persisting object stringifications", () => {
  assert.equal(cleanTextInput(["accepted"], 20), "");
  assert.equal(cleanTextInput({ value: "Player" }, 60), "");
  assert.equal(cleanTextInput("  Player\nOne  ", 60), "Player One");

  const result = sanitizeProfileUpdate({
    displayName: { value: "Not a scalar" },
    games: [{ gameName: "Valorant", roles: [{ value: "Duelist" }, "Controller"] }]
  });
  assert.equal(result.displayName, "");
  assert.deepEqual(result.games[0].roles, ["Controller"]);
});

test("numeric inputs accept form strings but reject arrays and objects", () => {
  assert.equal(numberInput(" 4.5 "), 4.5);
  assert.equal(numberInput(5), 5);
  assert.equal(numberInput(["5"]), undefined);
  assert.equal(numberInput({ value: 5 }), undefined);
});

test("date inputs reject coercible collections and preserve valid instants", () => {
  assert.equal(dateInput(["2026-07-12T10:00:00.000Z"]), undefined);
  assert.equal(dateInput({ value: "2026-07-12T10:00:00.000Z" }), undefined);
  assert.equal(dateInput("2026-07-12T10:00:00.000Z")?.toISOString(), "2026-07-12T10:00:00.000Z");
});

test("room privacy keeps Discord invites private to hosts and members", () => {
  const room = {
    _id: "room-1",
    hostId: "host-1",
    currentMembers: [{ userId: "member-1", status: "joined" }],
    discord: {
      channelId: "channel-1",
      channelName: "clutchq-room",
      inviteUrl: "https://discord.gg/private",
      createdAt: "2026-07-01T00:00:00.000Z"
    }
  };

  assert.equal(sanitizeRoomForViewer(room, null).discord.inviteUrl, undefined);
  assert.equal(sanitizeRoomForViewer(room, "stranger").discord.channelId, undefined);
  assert.equal(sanitizeRoomForViewer(room, "host-1").discord.inviteUrl, "https://discord.gg/private");
  assert.equal(sanitizeRoomForViewer(room, "member-1").discord.inviteUrl, "https://discord.gg/private");
});

test("Steam OpenID return URL carries CSRF state but never a ClutchQ bearer token", () => {
  const previousCallback = process.env.STEAM_CALLBACK_URL;
  process.env.STEAM_CALLBACK_URL = "https://api.example.com/api/auth/steam/callback";
  try {
    const steamUrl = new URL(buildSteamAuthUrl({ state: "safe-state", token: "must-not-leak" }));
    const returnTo = new URL(steamUrl.searchParams.get("openid.return_to"));
    assert.equal(returnTo.searchParams.get("state"), "safe-state");
    assert.equal(returnTo.searchParams.has("token"), false);
    assert.equal(returnTo.searchParams.has("linkToken"), false);
    assert.equal(steamUrl.toString().includes("must-not-leak"), false);
  } finally {
    if (previousCallback === undefined) delete process.env.STEAM_CALLBACK_URL;
    else process.env.STEAM_CALLBACK_URL = previousCallback;
  }
});

test("Steam OpenID accepts only a canonical 17-digit SteamID", async () => {
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response("ns:http://specs.openid.net/auth/2.0\nis_valid:true\n", { status: 200 });
  try {
    await assert.rejects(
      () =>
        verifySteamOpenId({
          "openid.claimed_id": "https://steamcommunity.com/openid/id/1234",
          "openid.identity": "https://steamcommunity.com/openid/id/1234",
          "openid.sig": "signed"
        }),
      /SteamID was not returned/i
    );
    assert.equal(
      await verifySteamOpenId({
        "openid.claimed_id": "https://steamcommunity.com/openid/id/76561198000000000",
        "openid.identity": "https://steamcommunity.com/openid/id/76561198000000000",
        "openid.sig": "signed"
      }),
      "76561198000000000"
    );
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test("Steam HTTP 200 privacy responses are not mistaken for confirmed empty data", async () => {
  const previousFetch = globalThis.fetch;
  const previousApiKey = process.env.STEAM_API_KEY;
  process.env.STEAM_API_KEY = "0123456789ABCDEF0123456789ABCDEF";

  try {
    globalThis.fetch = async () => new Response(JSON.stringify({ response: {} }), { status: 200 });
    await assert.rejects(() => getOwnedGames("76561198000000000"), /private or unavailable/i);

    globalThis.fetch = async () => new Response(JSON.stringify({ friendslist: {} }), { status: 200 });
    await assert.rejects(() => getFriendList("76561198000000000"), /private or unavailable/i);

    globalThis.fetch = async () => new Response(
      JSON.stringify({ playerstats: { success: false, error: "Profile is not public" } }),
      { status: 200 }
    );
    await assert.rejects(() => getPlayerAchievements("76561198000000000", 730), /private or unavailable/i);

    globalThis.fetch = async () => new Response(JSON.stringify({ response: { game_count: 0, games: [] } }), { status: 200 });
    assert.deepEqual(await getOwnedGames("76561198000000000"), []);

    globalThis.fetch = async () => new Response(JSON.stringify({ friendslist: { friends: [] } }), { status: 200 });
    assert.deepEqual(await getFriendList("76561198000000000"), []);

    globalThis.fetch = async () => new Response(
      JSON.stringify({ playerstats: { success: true, achievements: [] } }),
      { status: 200 }
    );
    assert.deepEqual(await getPlayerAchievements("76561198000000000", 730), []);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousApiKey === undefined) delete process.env.STEAM_API_KEY;
    else process.env.STEAM_API_KEY = previousApiKey;
  }
});

test("destructive scripts require an explicit production unlock", () => {
  const previousNodeEnv = process.env.NODE_ENV;
  const previousFlag = process.env.ALLOW_DATABASE_CLEAR;
  process.env.NODE_ENV = "production";
  delete process.env.ALLOW_DATABASE_CLEAR;
  try {
    assert.throws(
      () => assertDestructiveScriptAllowed("ALLOW_DATABASE_CLEAR", "Database clearing"),
      /blocked in production/
    );
    process.env.ALLOW_DATABASE_CLEAR = "true";
    assert.doesNotThrow(() => assertDestructiveScriptAllowed("ALLOW_DATABASE_CLEAR", "Database clearing"));
  } finally {
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousNodeEnv;
    if (previousFlag === undefined) delete process.env.ALLOW_DATABASE_CLEAR;
    else process.env.ALLOW_DATABASE_CLEAR = previousFlag;
  }
});

test("safe user JSON never exposes provider tokens or token version", () => {
  const user = new User({
    name: "Secure User",
    email: "secure@example.com",
    tokenVersion: 7,
    authProviders: {
      discord: {
        id: "discord-id",
        username: "secure",
        accessToken: "secret-access-token",
        refreshToken: "secret-refresh-token"
      }
    }
  });
  const safe = user.toSafeJSON();
  assert.equal(safe.tokenVersion, undefined);
  assert.equal(safe.authProviders.discord.accessToken, undefined);
  assert.equal(safe.authProviders.discord.refreshToken, undefined);
});

test("local account hashes stay hidden without breaking later document saves", () => {
  assert.equal(User.schema.path("passwordHash").options.select, false);

  const newLocalUser = new User({ name: "Local User", email: "local@example.com" });
  assert.match(newLocalUser.validateSync()?.errors?.passwordHash?.message || "", /required/i);

  const existingLocalUser = new User({ name: "Existing User", email: "existing@example.com" });
  existingLocalUser.isNew = false;
  assert.equal(existingLocalUser.validateSync()?.errors?.passwordHash, undefined);
});

test("pending and dismissed reports never count as substantiated reputation evidence", () => {
  assert.equal(substantiatedReportStatuses.includes("pending"), false);
  assert.equal(substantiatedReportStatuses.includes("dismissed"), false);
  assert.equal(substantiatedReportStatuses.includes("warned"), true);
  assert.equal(substantiatedReportStatuses.includes("suspended"), true);
});

test("analytics fallback does not invent performance when no evidence exists", () => {
  const analysis = fallbackAnalyzeScorecard({ gameName: "Valorant" });
  assert.equal(analysis.data.performance.overall, 0);
  assert.equal(analysis.data.performance.combat, 0);
  assert.equal(analysis.data.performance.consistency, 0);
  assert.equal(analysis.confidence, 0);

  const graph = fallbackRebuildGameplayGraph({});
  assert.equal(graph.data.gameplayProfileScore, 0);
  assert.equal(graph.confidence, 0);
  assert.deepEqual(graph.data.situationalStrengths, []);
  assert.equal(graph.data.style.mainStyle, "Profile still forming");

  const teammateFit = fallbackComputeTeammateFit({
    viewerGraph: {},
    candidateGraphs: [{ userId: "candidate-1", confidence: 0 }],
    candidateProfiles: [{ userId: "candidate-1", displayName: "Candidate" }]
  });
  assert.equal(teammateFit.data.matches[0].compatibility, 0);
  assert.equal(teammateFit.data.matches[0].confidence, 0);
});

test("Node exchanges bounded JSON with the Python analytics worker", async () => {
  const result = await runAnalyticsTask(
    "build_rhythm",
    {
      sessions: [
        {
          gameName: "Valorant",
          startedAt: "2026-06-20T18:00:00.000Z",
          durationMinutes: 90,
          status: "completed"
        }
      ]
    },
    { timeoutMs: 5000 }
  );

  assert.equal(result.success, true);
  assert.equal(result.task, "build_rhythm");
  assert.equal(result.source, "python");
  assert.equal(result.data.series.length, 56);
  assert.equal(result.data.summary.totalMinutes, 90);
});

test("rhythm fallback returns a continuous dated window without treating lifetime Steam hours as recent", () => {
  const lifetimeOnly = fallbackBuildRhythm({
    steamLibrary: [{ name: "Old Game", playtimeForeverMinutes: 9000, playtimeLastTwoWeeksMinutes: 0 }]
  });
  assert.equal(lifetimeOnly.data.series.length, 56);
  assert.equal(lifetimeOnly.data.summary.totalMinutes, 0);
  assert.equal(lifetimeOnly.data.summary.rhythmScore, 0);
  assert.equal(lifetimeOnly.data.confidence, 0);
  assert.deepEqual(lifetimeOnly.data.gameMix, []);

  const recentAggregate = fallbackBuildRhythm({
    steamLibrary: [{ name: "Current Game", playtimeForeverMinutes: 9000, playtimeLastTwoWeeksMinutes: 120 }]
  });
  assert.equal(recentAggregate.data.summary.totalMinutes, 0);
  assert.equal(recentAggregate.data.gameMix[0].minutes, 120);
  for (let index = 1; index < recentAggregate.data.series.length; index += 1) {
    const previous = new Date(`${recentAggregate.data.series[index - 1].date}T00:00:00.000Z`);
    const current = new Date(`${recentAggregate.data.series[index].date}T00:00:00.000Z`);
    assert.equal(current.getTime() - previous.getTime(), 24 * 60 * 60 * 1000);
  }
});

test("query filters reject nested and repeated query shapes", () => {
  assert.equal(boundedQueryText({ $ne: "" }), "");
  assert.equal(boundedQueryText(["India", "Europe"]), "");
  assert.equal(boundedQueryText("  India\nWest  "), "India West");
  assert.equal(boundedSlug("../../Counter Strike 2"), "counter-strike-2");
});

test("boolean form values cannot turn the string false into true", () => {
  assert.equal(booleanInput(false), false);
  assert.equal(booleanInput("false"), false);
  assert.equal(booleanInput("0"), false);
  assert.equal(booleanInput("true"), true);
  assert.equal(booleanInput("1"), true);
  assert.equal(booleanInput({ unexpected: true }), false);
});

test("local dev remains local when a copied env file says production, while Render stays production", () => {
  const previous = {
    NODE_ENV: process.env.NODE_ENV,
    npm_lifecycle_event: process.env.npm_lifecycle_event,
    RENDER: process.env.RENDER,
    RENDER_EXTERNAL_URL: process.env.RENDER_EXTERNAL_URL
  };
  process.env.NODE_ENV = "production";
  process.env.npm_lifecycle_event = "dev";
  delete process.env.RENDER;
  delete process.env.RENDER_EXTERNAL_URL;

  try {
    assert.equal(isLocalDevelopment(), true);
    assert.equal(isProductionRuntime(), false);
    process.env.RENDER = "true";
    assert.equal(isLocalDevelopment(), false);
    assert.equal(isProductionRuntime(), true);
    delete process.env.NODE_ENV;
    delete process.env.npm_lifecycle_event;
    assert.equal(isLocalDevelopment(), false);
    assert.equal(isProductionRuntime(), true);
  } finally {
    Object.entries(previous).forEach(([key, value]) => {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    });
  }
});

test("hosted runtime validates production secrets even when NODE_ENV is missing", () => {
  const keys = [
    "NODE_ENV",
    "npm_lifecycle_event",
    "RENDER",
    "MONGO_URI",
    "JWT_SECRET",
    "CLIENT_URL",
    "SERVER_URL",
    "TURNSTILE_SECRET_KEY",
    "TURNSTILE_ALLOWED_HOSTNAMES"
  ];
  const previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  delete process.env.NODE_ENV;
  process.env.RENDER = "true";
  delete process.env.MONGO_URI;

  try {
    assert.throws(() => validateEnv(), /Missing required production environment variables/);
    Object.assign(process.env, {
      MONGO_URI: "mongodb+srv://user:password@example.mongodb.net/clutchq",
      JWT_SECRET: "a-realistic-production-secret-that-is-long-enough",
      CLIENT_URL: "https://client.example.com",
      SERVER_URL: "https://api.example.com",
      TURNSTILE_SECRET_KEY: "configured-secret"
    });
    delete process.env.TURNSTILE_ALLOWED_HOSTNAMES;
    assert.doesNotThrow(() => validateEnv());
    assert.deepEqual(getTurnstileAllowedHostnames(), ["client.example.com"]);
    process.env.TURNSTILE_ALLOWED_HOSTNAMES = "https://client.example.com/";
    assert.doesNotThrow(() => validateEnv());
    assert.deepEqual(getTurnstileAllowedHostnames(), ["client.example.com"]);
    process.env.TURNSTILE_ALLOWED_HOSTNAMES = "https://client.example.com/path";
    assert.throws(() => validateEnv(), /TURNSTILE_ALLOWED_HOSTNAMES/);
  } finally {
    Object.entries(previous).forEach(([key, value]) => {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    });
  }
});

test("trust recalculation is stable and cannot compound its previous trust score", () => {
  const lowPrior = calculateTrustScore({ profile: { trustScore: 20, reliabilityScore: 80 }, reviews: [] });
  const highPrior = calculateTrustScore({ profile: { trustScore: 100, reliabilityScore: 80 }, reviews: [] });
  assert.equal(lowPrior.trustScore, highPrior.trustScore);
  assert.equal(lowPrior.trustScore, 73);

  const strongReviews = Array.from({ length: 5 }, () => ({
    communication: 5,
    teamwork: 5,
    skill: 5,
    punctuality: 5,
    behavior: 5
  }));
  const reviewed = calculateTrustScore({ profile: { reliabilityScore: 80 }, reviews: strongReviews });
  assert.equal(reviewed.trustScore, 94);
});

test("matchmaking awards no phantom rank or playstyle points to empty profiles", () => {
  const result = calculateMatchScore({}, {});
  assert.equal(result.totalScore, 0);
  assert.equal(result.confidence.level, "Low");
  assert.equal(result.breakdown.every((item) => item.score === 0), true);

  const blankGameProfiles = calculateMatchScore(
    { games: [{ gameName: "Valorant", rank: "", rankValue: null, isPrimary: true }] },
    { games: [{ gameName: "Valorant", rank: "", rankValue: null, isPrimary: true }] }
  );
  assert.equal(blankGameProfiles.breakdown.find((item) => item.key === "rank").score, 0);
  assert.equal(blankGameProfiles.breakdown.find((item) => item.key === "playstyle").score, 0);
});

test("matchmaking uses the requested game's rank and roles instead of unrelated primary games", () => {
  const first = {
    region: "India",
    languages: ["English"],
    games: [
      { gameName: "Valorant", rank: "Diamond 3", rankValue: 18, roles: ["Duelist"], isPrimary: true },
      { gameName: "CS2", rank: "Gold", rankValue: 12, roles: ["Entry"] }
    ]
  };
  const second = {
    region: "india",
    languages: ["english"],
    games: [
      { gameName: "Valorant", rank: "Iron 1", rankValue: 1, roles: ["Duelist"], isPrimary: true },
      { gameName: "Counter-Strike 2", rank: "Gold", rankValue: 12, roles: ["Support"] }
    ]
  };

  const result = calculateMatchScore(first, second, { game: "Counter-Strike 2" });
  assert.equal(result.breakdown.find((item) => item.key === "game").score, 25);
  assert.equal(result.breakdown.find((item) => item.key === "rank").score, 20);
  assert.equal(result.breakdown.find((item) => item.key === "roles").score, 10);
  assert.equal(result.breakdown.find((item) => item.key === "region").score, 15);
  assert.equal(result.breakdown.find((item) => item.key === "language").score, 10);

  const missingGame = calculateMatchScore(first, { ...second, games: second.games.slice(0, 1) }, { game: "CS2" });
  assert.equal(missingGame.breakdown.find((item) => item.key === "game").score, 0);
  assert.equal(missingGame.breakdown.find((item) => item.key === "rank").score, 0);
});

test("lobby recommendations validate rank against the lobby game", () => {
  const profile = {
    micAvailable: true,
    games: [
      { gameName: "Valorant", rankValue: 2, isPrimary: true },
      { gameName: "CS2", rankValue: 20, isPrimary: false }
    ]
  };
  const lobby = {
    game: "CS2",
    rankMinValue: 19,
    rankMaxValue: 21,
    currentMembers: [],
    micRequired: false
  };

  assert.equal(calculateLobbyCompatibility(profile, lobby, new Map()), 8);
});

test("gameplay graph teammate edges require shared history or direct feedback", () => {
  const viewer = "507f1f77bcf86cd799439011";
  const teammate = "507f191e810c19729de860ea";
  const unrelated = "507f191e810c19729de860eb";
  const result = fallbackRebuildGameplayGraph({
    user: { _id: viewer },
    lobbies: [
      { game: "Valorant", currentMembers: [{ userId: { _id: viewer, name: "Viewer" } }, { userId: { _id: teammate, name: "Teammate" } }] },
      { game: "CS2", currentMembers: [{ userId: { _id: viewer, name: "Viewer" } }, { userId: { _id: teammate, name: "Teammate" } }] }
    ],
    feedbackReceived: [{ fromUserId: teammate, ratings: { communication: 4, teamwork: 4 } }]
  });

  assert.equal(result.data.teammateEdges.length, 1);
  assert.equal(result.data.teammateEdges[0].userId, teammate);
  assert.equal(result.data.teammateEdges[0].compatibility, 76);
  assert.deepEqual(result.data.teammateEdges[0].sharedGames, ["Valorant", "CS2"]);
  assert.equal(result.data.teammateEdges[0].reason, "Based on teammate feedback and 2 completed shared lobbies.");
  assert.equal(result.data.teammateEdges.some((edge) => edge.userId === unrelated), false);
});

test("Steam demo sync logs validate and running syncs have a cross-instance uniqueness guard", () => {
  const log = new SteamSyncLog({
    userId: "507f1f77bcf86cd799439011",
    steamId: "76561199000072910",
    syncType: "demo",
    status: "success"
  });
  assert.equal(log.validateSync(), undefined);

  const runningIndex = SteamSyncLog.schema.indexes().find(
    ([fields, options]) => fields.userId === 1 && fields.status === 1 && options?.partialFilterExpression?.status === "running"
  );
  assert.equal(Boolean(runningIndex?.[1]?.unique), true);
});

test("OAuth handoff records separate login from provider-link intent", () => {
  const base = {
    userId: "507f1f77bcf86cd799439011",
    codeHash: "a".repeat(64),
    expiresAt: new Date(Date.now() + 60_000)
  };
  const link = new OAuthLoginCode({ ...base, purpose: "link", provider: "steam", tokenVersion: 3 });
  assert.equal(link.validateSync(), undefined);
  assert.equal(link.tokenVersion, 3);

  const missingProvider = new OAuthLoginCode({ ...base, codeHash: "b".repeat(64), purpose: "link" });
  assert.match(missingProvider.validateSync()?.errors?.provider?.message || "", /required/i);
});

test("OAuth sign-in never infers account linking from an ordinary session cookie", async () => {
  const result = await getLinkUserFromRequest(
    { cookies: { token: "an-old-session-cookie-must-not-link-accounts" } },
    "google"
  );
  assert.equal(result, null);
});

test("normal OAuth sign-in clears abandoned provider-link intent", async () => {
  const cleared = [];
  const result = await prepareOAuthLinkCookie(
    { query: {} },
    { clearCookie: (name) => cleared.push(name) },
    "google"
  );
  assert.equal(result, true);
  assert.deepEqual(cleared, ["clutchq_google_oauth_link"]);
});

test("destructive Discord cleanup is a safe no-op when no channels are stored", async () => {
  assert.deepEqual(await cleanupDiscordChannelsBeforeDelete([], "Test cleanup"), { cleaned: 0, failed: 0 });
});

test("shared demo identities are recognized centrally and case-insensitively", () => {
  assert.equal(isSharedDemoEmail(" Demo@ClutchQ.com "), true);
  assert.equal(isSharedDemoUser({ email: "captain@clutchq.com" }), true);
  assert.equal(isSharedDemoUser({ email: "real-player@example.com" }), false);
});

test("Discord provisioning uses a guarded cross-instance lease", async () => {
  const calls = [];
  const model = {
    async findOneAndUpdate(filter, update, options) {
      calls.push({ kind: "findOneAndUpdate", filter, update, options });
      if (calls.length === 1) return { _id: "room-1", title: "Room", discord: undefined };
      return { _id: "room-1", discord: { channelId: "123", inviteUrl: "https://discord.gg/test" } };
    },
    async updateOne(filter, update) {
      calls.push({ kind: "updateOne", filter, update });
    }
  };
  const guard = { ownerId: "owner-1", status: { $ne: "closed" } };
  const lease = await acquireDiscordProvisioningLease({ model, resourceId: "room-1", guard });
  assert.match(lease.token, /^[a-f0-9]{48}$/);
  assert.equal(calls[0].filter.ownerId, "owner-1");
  assert.equal(calls[0].update.$set["discord.provisioningToken"], lease.token);

  await persistDiscordProvision({
    model,
    resourceId: "room-1",
    guard,
    token: lease.token,
    discord: { channelId: "123", channelName: "room", inviteUrl: "https://discord.gg/test" }
  });
  assert.equal(calls[1].filter["discord.provisioningToken"], lease.token);
  assert.equal(calls[1].update.$set["discord.channelId"], "123");
  assert.equal(calls[1].update.$unset["discord.provisioningStartedAt"], "");

  await releaseDiscordProvisioningLease({ model, resourceId: "room-1", token: lease.token });
  assert.equal(calls[2].filter["discord.provisioningToken"], lease.token);
});

test("Turnstile bypasses only an unconfigured local environment", async () => {
  const previous = {
    NODE_ENV: process.env.NODE_ENV,
    TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY,
    npm_lifecycle_event: process.env.npm_lifecycle_event,
    RENDER: process.env.RENDER
  };
  delete process.env.TURNSTILE_SECRET_KEY;
  delete process.env.RENDER;

  try {
    process.env.NODE_ENV = "development";
    assert.equal((await verifyTurnstileToken(undefined, "127.0.0.1")).success, true);
    process.env.NODE_ENV = "production";
    process.env.npm_lifecycle_event = "start";
    assert.equal((await verifyTurnstileToken(undefined, "127.0.0.1")).success, false);
  } finally {
    Object.entries(previous).forEach(([key, value]) => {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    });
  }
});

test("disabled OAuth callback placeholders do not block production startup", () => {
  const keys = [
    "NODE_ENV",
    "npm_lifecycle_event",
    "RENDER",
    "MONGO_URI",
    "JWT_SECRET",
    "CLIENT_URL",
    "SERVER_URL",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "GOOGLE_CALLBACK_URL",
    "STEAM_CALLBACK_URL"
  ];
  const previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]));

  Object.assign(process.env, {
    NODE_ENV: "production",
    npm_lifecycle_event: "start",
    RENDER: "true",
    MONGO_URI: "mongodb+srv://user:password@example.mongodb.net/clutchq",
    JWT_SECRET: "a-realistic-production-secret-that-is-long-enough",
    CLIENT_URL: "https://client.example.com",
    SERVER_URL: "https://api.example.com",
    GOOGLE_CALLBACK_URL: "http://localhost:5000/api/auth/google/callback"
  });
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
    delete process.env.STEAM_CALLBACK_URL;

    try {
      assert.doesNotThrow(() => validateEnv());
      process.env.GOOGLE_CLIENT_ID = "...";
      assert.throws(() => validateEnv(), /Replace placeholder integration variables/);
      process.env.GOOGLE_CLIENT_ID = "client-id";
      process.env.GOOGLE_CLIENT_SECRET = "client-secret";
      assert.throws(() => validateEnv(), /GOOGLE_CALLBACK_URL/);
  } finally {
    Object.entries(previous).forEach(([key, value]) => {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    });
  }
});
