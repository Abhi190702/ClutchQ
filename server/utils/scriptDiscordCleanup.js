import { deleteDiscordChannel } from "../services/discordService.js";

const cleanupConcurrency = 5;

export const cleanupDiscordChannelsBeforeDelete = async (resources = [], actionLabel = "Database reset") => {
  const channelIds = [
    ...new Set(resources.map((resource) => String(resource?.discord?.channelId || "").trim()).filter(Boolean))
  ];
  if (!channelIds.length) return { cleaned: 0, failed: 0 };

  const failures = [];
  for (let offset = 0; offset < channelIds.length; offset += cleanupConcurrency) {
    const batch = channelIds.slice(offset, offset + cleanupConcurrency);
    const results = await Promise.allSettled(batch.map((channelId) => deleteDiscordChannel(channelId)));
    results.forEach((result) => {
      if (result.status === "rejected") failures.push(result.reason);
    });
  }

  if (failures.length && process.env.ALLOW_ORPHANED_DISCORD_CHANNELS !== "true") {
    throw new Error(
      `${actionLabel} stopped because ${failures.length} Discord voice channel(s) could not be cleaned up. ` +
      "Restore the Discord bot configuration and retry. Set ALLOW_ORPHANED_DISCORD_CHANNELS=true only when those channels were removed manually."
    );
  }
  if (failures.length) {
    console.warn(`${actionLabel}: continuing after ${failures.length} explicitly acknowledged Discord cleanup failure(s).`);
  }

  return { cleaned: channelIds.length - failures.length, failed: failures.length };
};
