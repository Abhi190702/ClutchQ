import mongoose from "mongoose";

const steamFriendSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    steamId: {
      type: String,
      required: true,
      index: true,
      match: /^\d{17}$/
    },
    friendSteamId: {
      type: String,
      required: true,
      match: /^\d{17}$/
    },
    relationship: { type: String, trim: true, maxlength: 30 },
    friendSince: Date,
    displayName: { type: String, trim: true, maxlength: 200 },
    avatar: { type: String, maxlength: 600 },
    profileUrl: { type: String, maxlength: 600 },
    lastSyncedAt: Date,
    onClutchQ: {
      type: Boolean,
      default: false
    },
    clutchQUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  { timestamps: true }
);

steamFriendSchema.index({ userId: 1, friendSteamId: 1 }, { unique: true });

const SteamFriend = mongoose.model("SteamFriend", steamFriendSchema);

export default SteamFriend;
