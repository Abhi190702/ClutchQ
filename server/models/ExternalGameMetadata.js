import mongoose from "mongoose";

const externalGameMetadataSchema = new mongoose.Schema(
  {
    gameSlug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    source: {
      type: String,
      enum: ["catalog", "freetogame", "rawg", "manual"],
      default: "catalog",
      index: true
    },
    coverUrl: String,
    bannerUrl: String,
    screenshots: [String],
    genres: [String],
    platforms: [String],
    releaseDate: Date,
    developer: String,
    publisher: String,
    raw: mongoose.Schema.Types.Mixed,
    lastSyncedAt: {
      type: Date,
      index: true
    }
  },
  { timestamps: true }
);

externalGameMetadataSchema.index({ gameSlug: 1 }, { unique: true });
externalGameMetadataSchema.index({ title: "text", gameSlug: "text", genres: "text", platforms: "text" });

const ExternalGameMetadata = mongoose.model("ExternalGameMetadata", externalGameMetadataSchema);

export default ExternalGameMetadata;
