const getId = (value) => String(value?._id || value || "");

export const sanitizeRoomForViewer = (room, userId, ownerField = "hostId") => {
  const output = room?.toObject ? room.toObject({ virtuals: true }) : { ...room };
  if (Array.isArray(output.currentMembers)) {
    output.currentMembers = output.currentMembers.filter((member) => member?.userId);
  }
  if (!output?.discord) return output;

  const viewerId = getId(userId);
  const ownerId = getId(output[ownerField]);
  const isMember = output.currentMembers?.some((member) => getId(member.userId) === viewerId && member.status !== "left");

  if (!viewerId || (ownerId !== viewerId && !isMember)) {
    output.discord = output.discord.channelName
      ? {
          channelName: output.discord.channelName,
          createdAt: output.discord.createdAt
        }
      : undefined;
  }

  return output;
};
