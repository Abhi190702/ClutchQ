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
      index: true
    },
    friendSteamId: {
      type: String,
      required: true
    },
    relationship: String,
    friendSince: Date,
    displayName: String,
    avatar: String,
    profileUrl: String,
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
