import mongoose from "mongoose";

const externalGameMetadataSchema = new mongoose.Schema(
  {
    gameSlug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 80
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160
    },
    source: {
      type: String,
      enum: ["catalog", "freetogame", "rawg", "manual"],
      default: "catalog",
      index: true
    },
    coverUrl: { type: String, maxlength: 2048 },
    bannerUrl: { type: String, maxlength: 2048 },
    screenshots: [{ type: String, maxlength: 2048 }],
    genres: [{ type: String, maxlength: 60 }],
    platforms: [{ type: String, maxlength: 60 }],
    releaseDate: Date,
    developer: { type: String, maxlength: 160 },
    publisher: { type: String, maxlength: 160 },
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
