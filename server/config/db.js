import mongoose from "mongoose";

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/clutchq";

  try {
    const connection = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000
    });
    console.log(`MongoDB connected: ${connection.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    console.error("Start MongoDB locally, run docker compose up -d mongo, or set MONGO_URI to a MongoDB Atlas connection string.");
    process.exit(1);
  }
};

export default connectDB;
