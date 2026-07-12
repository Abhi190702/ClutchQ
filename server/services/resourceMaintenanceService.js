import GameActivity from "../models/GameActivity.js";
import GameRoom from "../models/GameRoom.js";
import Lobby from "../models/Lobby.js";
import Request from "../models/Request.js";
import ScorecardUpload from "../models/ScorecardUpload.js";
import SteamSyncLog from "../models/SteamSyncLog.js";
import { deleteDiscordChannel } from "./discordService.js";

const resourceStaleMs = 24 * 60 * 60 * 1000;
const steamSyncStaleMs = 5 * 60 * 1000;
const scorecardStaleMs = 15 * 60 * 1000;
const maintenanceIntervalMs = 15 * 60 * 1000;
const cleanupBatchSize = 50;
const discordCleanupConcurrency = 5;

const cleanDiscordChannels = async (resources) => {
  const cleanedIds = [];
  const warnings = [];

  for (let offset = 0; offset < resources.length; offset += discordCleanupConcurrency) {
    const batch = resources.slice(offset, offset + discordCleanupConcurrency);
    await Promise.all(
      batch.map(async (resource) => {
        if (!resource.discord?.channelId) return;
        try {
          await deleteDiscordChannel(resource.discord.channelId);
          cleanedIds.push(resource._id);
        } catch (error) {
          warnings.push(`${resource.constructor.modelName} ${resource._id}: ${error.message}`);
        }
      })
    );
  }

  return { cleanedIds, warnings };
};

const performMaintenance = async () => {
  const now = new Date();
  const resourceCutoff = new Date(now.getTime() - resourceStaleMs);
  const syncCutoff = new Date(now.getTime() - steamSyncStaleMs);
  const scorecardCutoff = new Date(now.getTime() - scorecardStaleMs);

  const staleLobbyTime = {
    $or: [
      { startTime: { $lt: resourceCutoff } },
      { startTime: null, createdAt: { $lt: resourceCutoff } }
    ]
  };
  const staleRoomTime = {
    $or: [
      { startsAt: { $lt: resourceCutoff } },
      { startsAt: null, createdAt: { $lt: resourceCutoff } }
    ]
  };

  const [staleLobbies, staleRooms, orphanedLobbies, orphanedRooms, pendingLobbyRequests] = await Promise.all([
    Lobby.find({ status: { $in: ["open", "full"] }, ...staleLobbyTime })
      .select("_id")
      .limit(cleanupBatchSize),
    GameRoom.find({ status: { $in: ["open", "full", "starting", "in_game"] }, ...staleRoomTime })
      .select("_id")
      .limit(cleanupBatchSize),
    Lobby.find({ status: "closed", "discord.channelId": { $exists: true, $ne: "" } })
      .select("_id discord")
      .limit(cleanupBatchSize),
    GameRoom.find({ status: { $in: ["completed", "cancelled"] }, "discord.channelId": { $exists: true, $ne: "" } })
      .select("_id discord")
      .limit(cleanupBatchSize),
    Request.find({ status: "pending", lobbyId: { $ne: null } })
      .select("lobbyId")
      .sort({ createdAt: 1 })
      .limit(cleanupBatchSize * 2)
      .lean()
  ]);

  const lobbyIds = staleLobbies.map((item) => item._id);
  const roomIds = staleRooms.map((item) => item._id);

  // Change local state first. The stale-time predicates make these updates safe
  // when another instance has just rescheduled or otherwise updated a resource.
  await Promise.all([
    lobbyIds.length
      ? Lobby.updateMany(
          { _id: { $in: lobbyIds }, status: { $in: ["open", "full"] }, ...staleLobbyTime },
          { $set: { status: "closed", pendingRequests: [] } }
        )
      : Promise.resolve(),
    roomIds.length
      ? GameRoom.updateMany(
          {
            _id: { $in: roomIds },
            status: { $in: ["open", "full", "starting", "in_game"] },
            ...staleRoomTime
          },
          { $set: { status: "cancelled" } }
        )
      : Promise.resolve(),
    GameActivity.updateMany(
      { status: "active", startedAt: { $lt: resourceCutoff } },
      {
        $set: {
          status: "cancelled",
          endedAt: now,
          durationMinutes: 0,
          notes: "Automatically expired after 24 hours."
        },
        $unset: { matchRating: "" }
      }
    ),
    SteamSyncLog.updateMany(
      { status: "running", startedAt: { $lt: syncCutoff } },
      {
        $set: {
          status: "failed",
          message: "Previous Steam sync did not finish.",
          finishedAt: now
        }
      }
    ),
    ScorecardUpload.updateMany(
      { status: "pending", createdAt: { $lt: scorecardCutoff } },
      {
        $set: {
          status: "failed",
          errorMessage: "Scorecard processing did not finish.",
          processedAt: now
        },
        $unset: { imageDataUrl: "" }
      }
    ),
    ScorecardUpload.updateMany(
      { status: { $in: ["processed", "failed"] }, imageDataUrl: { $exists: true } },
      { $unset: { imageDataUrl: "" } }
    )
  ]);

  const orphanedLobbyIds = orphanedLobbies.map((item) => item._id);
  const orphanedRoomIds = orphanedRooms.map((item) => item._id);
  const pendingRequestLobbyIds = [...new Set(pendingLobbyRequests.map((item) => String(item.lobbyId || "")).filter(Boolean))];
  const [closedLobbies, cancelledRooms, confirmedOrphanedLobbies, confirmedOrphanedRooms, closedPendingLobbies] = await Promise.all([
    lobbyIds.length
      ? Lobby.find({ _id: { $in: lobbyIds }, status: "closed" }).select("_id discord")
      : [],
    roomIds.length
      ? GameRoom.find({ _id: { $in: roomIds }, status: "cancelled" }).select("_id discord")
      : [],
    orphanedLobbyIds.length
      ? Lobby.find({
          _id: { $in: orphanedLobbyIds },
          status: "closed",
          "discord.channelId": { $exists: true, $ne: "" }
        }).select("_id discord")
      : [],
    orphanedRoomIds.length
      ? GameRoom.find({
          _id: { $in: orphanedRoomIds },
          status: { $in: ["completed", "cancelled"] },
          "discord.channelId": { $exists: true, $ne: "" }
        }).select("_id discord")
      : [],
    pendingRequestLobbyIds.length
      ? Lobby.find({ _id: { $in: pendingRequestLobbyIds }, status: "closed" }).select("_id")
      : []
  ]);

  const requestCleanupLobbyIds = [
    ...new Map(
      [...closedLobbies, ...confirmedOrphanedLobbies, ...closedPendingLobbies].map((item) => [String(item._id), item._id])
    ).values()
  ];
  if (requestCleanupLobbyIds.length) {
    await Request.updateMany(
      { lobbyId: { $in: requestCleanupLobbyIds }, status: "pending" },
      { $set: { status: "cancelled" } }
    );
  }

  const uniqueById = (resources) => [
    ...new Map(resources.map((resource) => [String(resource._id), resource])).values()
  ];
  const [lobbyDiscord, roomDiscord] = await Promise.all([
    cleanDiscordChannels(uniqueById([...closedLobbies, ...confirmedOrphanedLobbies])),
    cleanDiscordChannels(uniqueById([...cancelledRooms, ...confirmedOrphanedRooms]))
  ]);

  await Promise.all([
    lobbyDiscord.cleanedIds.length
      ? Lobby.updateMany({ _id: { $in: lobbyDiscord.cleanedIds }, status: "closed" }, { $unset: { discord: "" } })
      : Promise.resolve(),
    roomDiscord.cleanedIds.length
      ? GameRoom.updateMany(
          { _id: { $in: roomDiscord.cleanedIds }, status: { $in: ["completed", "cancelled"] } },
          { $unset: { discord: "" } }
        )
      : Promise.resolve()
  ]);

  return {
    staleLobbies: closedLobbies.length,
    staleRooms: cancelledRooms.length,
    warnings: [...lobbyDiscord.warnings, ...roomDiscord.warnings]
  };
};

let maintenanceInFlight = null;

export const runResourceMaintenance = async () => {
  if (maintenanceInFlight) return maintenanceInFlight;
  maintenanceInFlight = performMaintenance().finally(() => {
    maintenanceInFlight = null;
  });
  return maintenanceInFlight;
};

export const startResourceMaintenance = () => {
  const runSafely = () => {
    runResourceMaintenance()
      .then((result) => {
        if (result.warnings.length) {
          console.warn(`Resource maintenance completed with ${result.warnings.length} Discord cleanup warning(s).`);
        }
      })
      .catch((error) => {
        console.error("Resource maintenance failed:", error.message);
      });
  };

  const startupTimer = setTimeout(runSafely, 5000);
  const interval = setInterval(runSafely, maintenanceIntervalMs);
  startupTimer.unref();
  interval.unref();

  return async () => {
    clearTimeout(startupTimer);
    clearInterval(interval);
    if (maintenanceInFlight) {
      await maintenanceInFlight.catch(() => undefined);
    }
  };
};
