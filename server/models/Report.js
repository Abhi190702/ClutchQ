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
      required: true
    },
    details: String,
    status: {
      type: String,
      enum: ["pending", "reviewed", "dismissed", "warned", "suspended", "banned"],
      default: "pending"
    },
    adminNote: String,
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  { timestamps: true }
);

const Report = mongoose.model("Report", reportSchema);

export default Report;
