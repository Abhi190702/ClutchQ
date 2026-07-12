import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    reporterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    reportedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    reason: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    details: { type: String, trim: true, maxlength: 1000 },
    status: {
      type: String,
      enum: ["pending", "reviewed", "dismissed", "warned", "suspended", "banned"],
      default: "pending"
    },
    adminNote: { type: String, trim: true, maxlength: 1000 },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  { timestamps: true }
);

reportSchema.index({ reporterId: 1, reportedUserId: 1, status: 1, createdAt: -1 });

const Report = mongoose.model("Report", reportSchema);

export default Report;
