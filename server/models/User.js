import mongoose from "mongoose";

const authProviderSchema = new mongoose.Schema(
  {
    google: {
      id: String,
      email: String,
      name: String,
      avatar: String,
      connectedAt: Date
    },
    discord: {
      id: String,
      username: String,
      globalName: String,
      email: String,
      avatar: String,
      accessToken: String,
      refreshToken: String,
      tokenExpiresAt: Date,
      connectedAt: Date
    },
    steam: {
      steamId: String,
      displayName: String,
      avatar: String,
      profileUrl: String,
      level: Number,
      connectedAt: Date,
      lastSyncedAt: Date
    },
    epic: {
      accountId: String,
      displayName: String,
      connectedAt: Date
    },
    microsoft: {
      id: String,
      email: String,
      displayName: String,
      connectedAt: Date
    }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    passwordHash: {
      type: String,
      required() {
        return !this.authProviders?.google?.id && !this.authProviders?.discord?.id && !this.authProviders?.steam?.steamId;
      }
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user"
    },
    avatar: String,
    isSuspended: {
      type: Boolean,
      default: false
    },
    emailVerified: {
      type: Boolean,
      default: false
    },
    emailVerifiedAt: Date,
    lastLoginAt: Date,
    failedLoginAttempts: {
      type: Number,
      default: 0
    },
    lockedUntil: Date,
    authProviders: {
      type: authProviderSchema,
      default: () => ({})
    }
  },
  { timestamps: true }
);

const sanitizeAuthProviders = (providers = {}) => ({
  google: providers.google?.id
    ? {
        id: providers.google.id,
        email: providers.google.email,
        name: providers.google.name,
        avatar: providers.google.avatar,
        connectedAt: providers.google.connectedAt
      }
    : undefined,
  discord: providers.discord?.id
    ? {
        id: providers.discord.id,
        username: providers.discord.username,
        globalName: providers.discord.globalName,
        email: providers.discord.email,
        avatar: providers.discord.avatar,
        tokenExpiresAt: providers.discord.tokenExpiresAt,
        connectedAt: providers.discord.connectedAt
      }
    : undefined,
  steam: providers.steam?.steamId ? providers.steam : undefined,
  epic: providers.epic?.accountId ? providers.epic : undefined,
  microsoft: providers.microsoft?.id ? providers.microsoft : undefined
});

userSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    _id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    avatar: this.avatar,
    isSuspended: this.isSuspended,
    emailVerified: Boolean(this.emailVerified),
    emailVerifiedAt: this.emailVerifiedAt,
    lastLoginAt: this.lastLoginAt,
    authProviders: sanitizeAuthProviders(this.authProviders),
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

const User = mongoose.model("User", userSchema);

export default User;
