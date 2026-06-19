import Report from "../models/Report.js";
import { asyncHandler } from "../middleware/errorMiddleware.js";

export const createReport = asyncHandler(async (req, res) => {
  const { reportedUserId, reason, details } = req.body;

  if (!reportedUserId || !reason) {
    res.status(400);
    throw new Error("Reported user and reason are required");
  }

  if (String(reportedUserId) === String(req.user._id)) {
    res.status(400);
    throw new Error("You cannot report yourself");
  }

  const report = await Report.create({
    reporterId: req.user._id,
    reportedUserId,
    reason,
    details
  });

  res.status(201).json({
    success: true,
    message: "Report submitted for moderation",
    data: report
  });
});
