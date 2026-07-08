import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import helmet from "helmet";
import crypto from "crypto";
import mongoose from "mongoose";
import connectDB from "./config/db.js";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";
import { publicLimiter } from "./middleware/rateLimiters.js";
import validateEnv from "./utils/validateEnv.js";
import authRoutes from "./routes/authRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import matchmakingRoutes from "./routes/matchmakingRoutes.js";
import lobbyRoutes from "./routes/lobbyRoutes.js";
import requestRoutes from "./routes/requestRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import sessionRoutes from "./routes/sessionRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import discordRoutes from "./routes/discordRoutes.js";
import gameRoutes from "./routes/gameRoutes.js";
import gameRoomRoutes from "./routes/gameRoomRoutes.js";
import activityRoutes from "./routes/activityRoutes.js";
import leaderboardRoutes from "./routes/leaderboardRoutes.js";
import steamRoutes from "./routes/steamRoutes.js";
import intelligenceRoutes from "./routes/intelligenceRoutes.js";
import externalGameRoutes from "./routes/externalGameRoutes.js";

dotenv.config();
validateEnv();
await connectDB();

const app = express();
const isDevServer = process.env.npm_lifecycle_event === "dev";
const isProduction = process.env.NODE_ENV === "production";
const port = isDevServer ? process.env.LOCAL_PORT || 5000 : process.env.PORT || 5000;
const mongoStates = ["disconnected", "connected", "connecting", "disconnecting"];

app.set("trust proxy", 1);
app.disable("x-powered-by");

const normalizeOrigin = (origin) => {
  if (!origin) return null;
  const trimmed = origin.trim().replace(/\/$/, "");

  if (trimmed.startsWith("https:") && !trimmed.startsWith("https://")) {
    return trimmed.replace("https:", "https://");
  }

  if (trimmed.startsWith("http:") && !trimmed.startsWith("http://")) {
    return trimmed.replace("http:", "http://");
  }

  return trimmed;
};

const allowedOrigins = new Set(
  [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
    "https://clutch-q.vercel.app",
    process.env.CLIENT_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
    ...(process.env.ALLOWED_ORIGINS || "").split(",")
  ]
    .map(normalizeOrigin)
    .filter(Boolean)
);

const isLocalOrigin = (origin) => {
  try {
    const url = new URL(origin);
    return !isProduction && ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  } catch {
    return false;
  }
};

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
  })
);

app.use((req, res, next) => {
  const incomingRequestId = String(req.get("x-request-id") || "").trim();
  req.id = incomingRequestId || crypto.randomUUID();
  res.setHeader("X-Request-Id", req.id);
  next();
});

app.use(
  publicLimiter
);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || isLocalOrigin(origin) || allowedOrigins.has(normalizeOrigin(origin))) {
        callback(null, true);
        return;
      }

      const error = new Error(`CORS blocked origin: ${origin}`);
      error.statusCode = 403;
      callback(error);
    },
    credentials: true
  })
);
app.use(express.json({ limit: "1.5mb" }));
app.use(express.urlencoded({ extended: true, limit: "1.5mb" }));
app.use(cookieParser());

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "ClutchQ API is live",
    data: {
      version: "1.0.0",
      health: "/api/health"
    }
  });
});

app.get("/api/health", (req, res) => {
  const dbState = mongoStates[mongoose.connection.readyState] || "unknown";
  const healthy = dbState === "connected";

  res.status(healthy ? 200 : 503);
  res.json({
    success: healthy,
    message: healthy ? "Healthy" : "Degraded",
    data: {
      database: {
        state: dbState,
        host: mongoose.connection.host || null,
        name: mongoose.connection.name || null
      },
      environment: process.env.NODE_ENV || "development",
      requestId: req.id,
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    }
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/profiles", profileRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/matchmaking", matchmakingRoutes);
app.use("/api/lobbies", lobbyRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/discord", discordRoutes);
app.use("/api/games", gameRoutes);
app.use("/api/game-rooms", gameRoomRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/leaderboards", leaderboardRoutes);
app.use("/api/steam", steamRoutes);
app.use("/api/intelligence", intelligenceRoutes);
app.use("/api/external", externalGameRoutes);

app.use(notFound);
app.use(errorHandler);

const server = app.listen(port, () => {
  console.log(`ClutchQ API running on port ${port}`);
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${port} is already in use. Stop the existing server or set LOCAL_PORT/PORT.`);
    process.exit(1);
  }

  console.error("Server failed to start:", error);
  process.exit(1);
});

let isShuttingDown = false;

const shutdown = async (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`${signal} received. Shutting down ClutchQ API...`);

  const forceExit = setTimeout(() => {
    console.error("Forced shutdown after timeout.");
    process.exit(1);
  }, 10000);
  forceExit.unref();

  server.close(async (error) => {
    if (error) {
      console.error("HTTP server shutdown failed:", error);
      process.exit(1);
    }

    try {
      await mongoose.connection.close(false);
      console.log("ClutchQ API shutdown complete.");
      process.exit(0);
    } catch (dbError) {
      console.error("MongoDB shutdown failed:", dbError);
      process.exit(1);
    }
  });
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
  shutdown("uncaughtException");
});
