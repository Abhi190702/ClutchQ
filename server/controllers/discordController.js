import { asyncHandler } from "../middleware/errorMiddleware.js";
import { checkDiscordSetup } from "../services/discordService.js";

export const getDiscordHealth = asyncHandler(async (req, res) => {
  const health = await checkDiscordSetup();

  res.json({
    success: health.success,
    checks: health.checks
  });
});
