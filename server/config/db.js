import mongoose from "mongoose";

mongoose.set("strictQuery", true);

const connectDB = async () => {
  const isLocalDev = process.env.npm_lifecycle_event === "dev" || process.env.NODE_ENV === "development";
  const localMongoUri = process.env.LOCAL_MONGO_URI || "mongodb://127.0.0.1:27017/clutchq";
  const useProductionMongoOnLocal = process.env.USE_PRODUCTION_MONGO_ON_LOCAL === "true";
  const mongoUri = isLocalDev && !useProductionMongoOnLocal ? localMongoUri : process.env.MONGO_URI || localMongoUri;

  try {
    const connection = await mongoose.connect(mongoUri, {
      autoIndex: process.env.NODE_ENV !== "production",
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000
    });
    console.log(`MongoDB connected: ${connection.connection.host}`);
    return connection;
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    console.error("Start MongoDB locally, run docker compose up -d mongo, or set LOCAL_MONGO_URI/MONGO_URI to a reachable MongoDB connection string.");
    process.exit(1);
  }
};

mongoose.connection.on("disconnected", () => {
  console.warn("MongoDB disconnected.");
});

mongoose.connection.on("reconnected", () => {
  console.log("MongoDB reconnected.");
});

export default connectDB;
