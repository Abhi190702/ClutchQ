import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

const [{ default: validateEnv }, { default: connectDB }, { default: app }, { default: mongoose }] = await Promise.all([
  import("./utils/validateEnv.js"),
  import("./config/db.js"),
  import("./app.js"),
  import("mongoose")
]);
const { isProductionRuntime } = await import("./utils/runtimeEnv.js");
const { startResourceMaintenance } = await import("./services/resourceMaintenanceService.js");

validateEnv();
await connectDB();

const isProduction = isProductionRuntime();
const port = isProduction ? process.env.PORT || 5000 : process.env.LOCAL_PORT || process.env.PORT || 5000;

const server = app.listen(port, () => {
  console.log(`ClutchQ API running on port ${port}`);
});
const stopResourceMaintenance = startResourceMaintenance();

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
  const maintenanceShutdown = stopResourceMaintenance();
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
      await maintenanceShutdown;
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
  shutdown("unhandledRejection");
});
process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
  shutdown("uncaughtException");
});
