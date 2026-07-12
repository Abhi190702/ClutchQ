import Report from "../models/Report.js";
import User from "../models/User.js";
import { asyncHandler } from "../middleware/errorMiddleware.js";
import mongoose from "mongoose";
import { isSharedDemoUser } from "../utils/demoAccounts.js";
import { cleanTextInput } from "../utils/inputValue.js";

export const createReport = asyncHandler(async (req, res) => {
  if (isSharedDemoUser(req.user)) {
    res.status(403);
    throw new Error("Shared demo accounts cannot submit moderation reports.");
  }
  const { reportedUserId, reason, details } = req.body;
  const cleanReason = cleanTextInput(reason, 120);

  if (!reportedUserId || !cleanReason) {
    res.status(400);
    throw new Error("Reported user and reason are required");
  }

  if (!mongoose.isValidObjectId(reportedUserId)) {
    res.status(400);
    throw new Error("Invalid reported user");
  }

  if (String(reportedUserId) === String(req.user._id)) {
    res.status(400);
    throw new Error("You cannot report yourself");
  }

  const reportedUser = await User.exists({ _id: reportedUserId, isSuspended: { $ne: true } });
  if (!reportedUser) {
    res.status(404);
    throw new Error("Reported user not found");
  }

  const recentDuplicate = await Report.exists({
    reporterId: req.user._id,
    reportedUserId,
    status: "pending",
    createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
  });
  if (recentDuplicate) {
    res.status(409);
    throw new Error("You already submitted this report for review");
  }

  const report = await Report.create({
    reporterId: req.user._id,
    reportedUserId,
    reason: cleanReason,
    details: cleanTextInput(details, 1000)
  });

  res.status(201).json({
    success: true,
    message: "Report submitted for moderation",
    data: report
  });
});
