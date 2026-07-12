import mongoose from "mongoose";
import { isLocalDevelopment } from "../utils/runtimeEnv.js";

mongoose.set("strictQuery", true);

const connectDB = async () => {
  const isLocalDev = isLocalDevelopment();
  const localMongoUri = process.env.LOCAL_MONGO_URI || "mongodb://127.0.0.1:27017/clutchq";
  const useProductionMongoOnLocal = process.env.USE_PRODUCTION_MONGO_ON_LOCAL === "true";
  const mongoUri = isLocalDev && !useProductionMongoOnLocal ? localMongoUri : process.env.MONGO_URI || localMongoUri;

  try {
    const connection = await mongoose.connect(mongoUri, {
      autoIndex: process.env.MONGO_AUTO_INDEX !== "false",
      maxPoolSize: 10,
      minPoolSize: 1,
      maxIdleTimeMS: 30000,
      serverSelectionTimeoutMS: 10000
    });
    console.log(isLocalDev ? `MongoDB connected: ${connection.connection.host}` : "MongoDB connected.");
    return connection;
  } catch (error) {
    console.error(isLocalDev ? `MongoDB connection failed: ${error.message}` : "MongoDB connection failed.");
    console.error(
      isLocalDev
        ? "Start MongoDB locally, run docker compose up -d mongo, or set LOCAL_MONGO_URI to a reachable connection string."
        : "Check the hosted MongoDB network allowlist and MONGO_URI configuration."
    );
    process.exit(1);
  }
};

mongoose.connection.on("disconnected", () => {
  console.warn("MongoDB disconnected.");
});

mongoose.connection.on("reconnected", () => {
  console.log("MongoDB reconnected.");
});

mongoose.connection.on("error", (error) => {
  console.error(isLocalDevelopment() ? `MongoDB connection error: ${error.message}` : "MongoDB connection error.");
});

export default connectDB;
