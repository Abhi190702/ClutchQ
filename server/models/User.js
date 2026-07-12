import mongoose from "mongoose";

const authProviderSchema = new mongoose.Schema(
  {
    google: {
      id: { type: String, maxlength: 200 },
      email: { type: String, maxlength: 254 },
      name: { type: String, maxlength: 120 },
      avatar: { type: String, maxlength: 2048 },
      connectedAt: Date
    },
    discord: {
      id: { type: String, maxlength: 40 },
      username: { type: String, maxlength: 80 },
      globalName: { type: String, maxlength: 120 },
      email: { type: String, maxlength: 254 },
      avatar: { type: String, maxlength: 2048 },
      accessToken: { type: String, select: false, maxlength: 4000 },
      refreshToken: { type: String, select: false, maxlength: 4000 },
      tokenExpiresAt: Date,
      connectedAt: Date
    },
    steam: {
      steamId: { type: String, match: /^\d{17}$/ },
      displayName: { type: String, maxlength: 200 },
      avatar: { type: String, maxlength: 2048 },
      profileUrl: { type: String, maxlength: 2048 },
      level: { type: Number, min: 0, max: 100000 },
      connectedAt: Date,
      lastSyncedAt: Date
    },
    epic: {
      accountId: { type: String, maxlength: 200 },
      displayName: { type: String, maxlength: 200 },
      connectedAt: Date
    },
    microsoft: {
      id: { type: String, maxlength: 200 },
      email: { type: String, maxlength: 254 },
      displayName: { type: String, maxlength: 200 },
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
      trim: true,
      minlength: 2,
      maxlength: 80
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Enter a valid email address"]
    },
    passwordHash: {
      type: String,
      select: false,
      maxlength: 100,
      required() {
        if (!this.isNew) return false;
        return (
          !this.authProviders?.google?.id &&
          !this.authProviders?.discord?.id &&
          !this.authProviders?.steam?.steamId &&
          !this.authProviders?.epic?.accountId &&
          !this.authProviders?.microsoft?.id
        );
      }
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user"
    },
    avatar: { type: String, maxlength: 2048 },
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
    tokenVersion: {
      type: Number,
      default: 0,
      min: 0
    },
    authProviders: {
      type: authProviderSchema,
      default: () => ({})
    }
  },
  { timestamps: true }
);

userSchema.index(
  { "authProviders.google.id": 1 },
  { unique: true, partialFilterExpression: { "authProviders.google.id": { $type: "string" } } }
);
userSchema.index(
  { "authProviders.discord.id": 1 },
  { unique: true, partialFilterExpression: { "authProviders.discord.id": { $type: "string" } } }
);
userSchema.index(
  { "authProviders.steam.steamId": 1 },
  { unique: true, partialFilterExpression: { "authProviders.steam.steamId": { $type: "string" } } }
);
userSchema.index(
  { "authProviders.epic.accountId": 1 },
  { unique: true, partialFilterExpression: { "authProviders.epic.accountId": { $type: "string" } } }
);
userSchema.index(
  { "authProviders.microsoft.id": 1 },
  { unique: true, partialFilterExpression: { "authProviders.microsoft.id": { $type: "string" } } }
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
