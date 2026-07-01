import Report from "../models/Report.js";
import User from "../models/User.js";
import { asyncHandler } from "../middleware/errorMiddleware.js";
import mongoose from "mongoose";

export const createReport = asyncHandler(async (req, res) => {
  const { reportedUserId, reason, details } = req.body;
  const cleanReason = String(reason || "").trim();

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

  const reportedUser = await User.exists({ _id: reportedUserId });
  if (!reportedUser) {
    res.status(404);
    throw new Error("Reported user not found");
  }

  const report = await Report.create({
    reporterId: req.user._id,
    reportedUserId,
    reason: cleanReason.slice(0, 120),
    details: details ? String(details).trim().slice(0, 1000) : ""
  });

  res.status(201).json({
    success: true,
    message: "Report submitted for moderation",
    data: report
  });
});
