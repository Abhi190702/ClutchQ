import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";
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

dotenv.config();
await connectDB();

const app = express();
const isDevServer = process.env.npm_lifecycle_event === "dev";
const port = isDevServer ? process.env.LOCAL_PORT || 5000 : process.env.PORT || 5000;

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
    return ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  } catch {
    return false;
  }
};

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || isLocalOrigin(origin) || allowedOrigins.has(normalizeOrigin(origin))) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true
  })
);
app.use(express.json({ limit: "1mb" }));
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
  res.json({
    success: true,
    message: "Healthy",
    data: {
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

app.use(notFound);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`ClutchQ API running on port ${port}`);
});
