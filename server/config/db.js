import mongoose from "mongoose";

const connectDB = async () => {
  const isLocalDev = process.env.npm_lifecycle_event === "dev" || process.env.NODE_ENV === "development";
  const localMongoUri = process.env.LOCAL_MONGO_URI || "mongodb://127.0.0.1:27017/clutchq";
  const useProductionMongoOnLocal = process.env.USE_PRODUCTION_MONGO_ON_LOCAL === "true";
  const mongoUri = isLocalDev && !useProductionMongoOnLocal ? localMongoUri : process.env.MONGO_URI || localMongoUri;

  try {
    const connection = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000
    });
    console.log(`MongoDB connected: ${connection.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    console.error("Start MongoDB locally, run docker compose up -d mongo, or set LOCAL_MONGO_URI/MONGO_URI to a reachable MongoDB connection string.");
    process.exit(1);
  }
};

export default connectDB;
