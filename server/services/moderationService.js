import GameRoom from "../models/GameRoom.js";
import GameActivity from "../models/GameActivity.js";
import Lobby from "../models/Lobby.js";
import Request from "../models/Request.js";
import { deleteDiscordChannel } from "./discordService.js";

const cleanHostedDiscordRooms = async (resources, resourceLabel) => {
  const successfulIds = [];
  const warnings = [];

  await Promise.all(
    resources.map(async (resource) => {
      if (!resource.discord?.channelId) return;
      try {
        await deleteDiscordChannel(resource.discord.channelId);
        successfulIds.push(resource._id);
      } catch (error) {
        warnings.push(`${resourceLabel} ${resource._id}: ${error.message}`);
      }
    })
  );

  return { successfulIds, warnings };
};

export const retireSuspendedUserResources = async (userId) => {
  const [hostedLobbies, hostedRooms] = await Promise.all([
    Lobby.find({ ownerId: userId, status: { $ne: "closed" } }).select("_id discord"),
    GameRoom.find({ hostId: userId, status: { $nin: ["completed", "cancelled"] } }).select("_id discord")
  ]);
  const hostedLobbyIds = hostedLobbies.map((item) => item._id);
  const hostedRoomIds = hostedRooms.map((item) => item._id);

  // Retire local resources before touching Discord. If MongoDB rejects the
  // moderation update, the user must not be left with an active room whose
  // external voice channel has already disappeared.
  await Promise.all([
    Lobby.updateMany(
      { ownerId: userId, status: { $ne: "closed" } },
      { $set: { status: "closed", pendingRequests: [] } }
    ),
    GameRoom.updateMany(
      { hostId: userId, status: { $nin: ["completed", "cancelled"] } },
      { $set: { status: "cancelled" } }
    ),
    Request.updateMany(
      {
        status: "pending",
        $or: [{ fromUser: userId }, { toUser: userId }, { lobbyId: { $in: hostedLobbyIds } }]
      },
      { $set: { status: "cancelled" } }
    ),
    Lobby.updateMany(
      { ownerId: { $ne: userId }, "currentMembers.userId": userId },
      { $pull: { currentMembers: { userId } } }
    ),
    GameRoom.updateMany(
      { hostId: { $ne: userId }, "currentMembers.userId": userId },
      { $pull: { currentMembers: { userId } } }
    ),
    GameActivity.updateMany(
      { userId, status: "active" },
      {
        $set: {
          status: "cancelled",
          endedAt: new Date(),
          durationMinutes: 0,
          notes: "Session cancelled by account moderation."
        },
        $unset: { matchRating: "" }
      }
    )
  ]);

  const [retiredLobbies, retiredRooms] = await Promise.all([
    hostedLobbyIds.length
      ? Lobby.find({ _id: { $in: hostedLobbyIds }, ownerId: userId, status: "closed" }).select("_id discord")
      : [],
    hostedRoomIds.length
      ? GameRoom.find({ _id: { $in: hostedRoomIds }, hostId: userId, status: "cancelled" }).select("_id discord")
      : []
  ]);
  const [lobbyCleanup, roomCleanup] = await Promise.all([
    cleanHostedDiscordRooms(retiredLobbies, "Lobby"),
    cleanHostedDiscordRooms(retiredRooms, "Game room")
  ]);

  await Promise.all([
    Lobby.updateMany(
      {
        status: "full",
        $expr: { $lt: [{ $size: { $ifNull: ["$currentMembers", []] } }, "$neededPlayers"] }
      },
      { $set: { status: "open" } }
    ),
    GameRoom.updateMany(
      {
        status: "full",
        $expr: { $lt: [{ $size: { $ifNull: ["$currentMembers", []] } }, "$maxMembers"] }
      },
      { $set: { status: "open" } }
    ),
    lobbyCleanup.successfulIds.length
      ? Lobby.updateMany({ _id: { $in: lobbyCleanup.successfulIds } }, { $unset: { discord: "" } })
      : Promise.resolve(),
    roomCleanup.successfulIds.length
      ? GameRoom.updateMany({ _id: { $in: roomCleanup.successfulIds } }, { $unset: { discord: "" } })
      : Promise.resolve()
  ]);

  return { warnings: [...lobbyCleanup.warnings, ...roomCleanup.warnings] };
};
