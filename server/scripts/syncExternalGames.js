import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import { syncExternalGameMetadata } from "../services/externalApis/gameMetadataService.js";

dotenv.config();

const run = async () => {
  await connectDB();
  const slugs = process.argv.slice(2);
  const result = await syncExternalGameMetadata({ slugs });

  console.log(`External game metadata sync complete: ${result.synced}/${result.requested} cached.`);
  if (result.errors.length) {
    console.log(`Sync warnings: ${result.errors.length}`);
    result.errors.slice(0, 10).forEach((error) => console.log(`${error.gameSlug}: ${error.message}`));
  }
  await mongoose.connection.close();
};

run().catch(async (error) => {
  console.error(`External game metadata sync failed: ${error.message}`);
  await mongoose.connection.close().catch(() => {});
  process.exit(1);
});
