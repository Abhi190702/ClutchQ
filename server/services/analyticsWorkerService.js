import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runFallbackTask } from "./fallbackAnalyticsService.js";
import { isProductionRuntime } from "../utils/runtimeEnv.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../..");
const workerPath = path.join(projectRoot, "analytics-worker", "main.py");
const maxPayloadBytes = 2 * 1024 * 1024;
const maxOutputBytes = 1024 * 1024;
const maxWorkerConcurrency = Math.max(1, Math.min(4, Number.parseInt(process.env.ANALYTICS_MAX_WORKERS || "2", 10) || 2));
const maxWorkerQueue = Math.max(1, Math.min(100, Number.parseInt(process.env.ANALYTICS_MAX_QUEUE || "20", 10) || 20));

let activeWorkers = 0;
const workerQueue = [];

const releaseWorkerSlot = () => {
  activeWorkers = Math.max(0, activeWorkers - 1);
  const next = workerQueue.shift();
  if (next) next();
};

const acquireWorkerSlot = () => {
  if (activeWorkers < maxWorkerConcurrency) {
    activeWorkers += 1;
    return Promise.resolve(releaseWorkerSlot);
  }
  if (workerQueue.length >= maxWorkerQueue) {
    return Promise.reject(new Error("Python analytics worker queue is full."));
  }
  return new Promise((resolve) => {
    workerQueue.push(() => {
      activeWorkers += 1;
      resolve(releaseWorkerSlot);
    });
  });
};

const candidateBins = () => {
  const bins = [process.env.PYTHON_BIN?.trim(), "python", "python3"].filter(Boolean);
  return [...new Set(bins)];
};

const timeoutForTask = (task, requestedTimeout) => {
  if (requestedTimeout) return requestedTimeout;
  if (task === "analyze_scorecard") return 15000;
  if (task === "rebuild_gameplay_graph") return 20000;
  return 12000;
};

const fallbackWarning = "Python worker unavailable. Used fallback analyzer.";

const normalizeFallback = (task, payload, warning) => {
  const fallback = runFallbackTask(task, payload);
  const warnings = [fallbackWarning, ...(fallback.warnings || []).filter((item) => item !== fallbackWarning)];
  if (!isProductionRuntime() && warning && !warnings.includes(warning)) warnings.push(`Worker detail: ${warning}`);
  return {
    ...fallback,
    warnings,
    source: "fallback"
  };
};

const runWithPythonBin = async (pythonBin, task, payload, timeoutMs) => {
  const input = JSON.stringify({ task, payload });
  if (Buffer.byteLength(input, "utf8") > maxPayloadBytes) {
    throw new Error("Analytics payload is too large.");
  }

  const releaseSlot = await acquireWorkerSlot();
  try {
    return await new Promise((resolve, reject) => {
    const child = spawn(pythonBin, [workerPath], {
      cwd: projectRoot,
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true
    });

    let stdout = "";
    let stderr = "";
    let settled = false;
    let outputExceeded = false;

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      child.kill("SIGKILL");
      reject(new Error("Python analytics worker timed out."));
    }, timeoutMs);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
      if (Buffer.byteLength(stdout, "utf8") > maxOutputBytes) {
        outputExceeded = true;
        child.kill("SIGKILL");
      }
    });

    child.stderr.on("data", (chunk) => {
      if (stderr.length < 256 * 1024) stderr += chunk.toString();
    });

    child.on("error", (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(error);
    });

    child.stdin.on("error", (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      child.kill("SIGKILL");
      reject(error);
    });

    child.on("close", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);

      if (outputExceeded) {
        reject(new Error("Python analytics worker output exceeded the safe limit."));
        return;
      }

      if (code !== 0) {
        reject(new Error(stderr.trim() || `Python analytics worker exited with code ${code}.`));
        return;
      }

      try {
        const parsed = JSON.parse(stdout.trim());
        resolve({
          ...parsed,
          source: parsed.success ? "python" : "fallback",
          pythonBin
        });
      } catch {
        reject(new Error("Python analytics worker returned invalid JSON."));
      }
    });

    child.stdin.end(input);
    });
  } finally {
    releaseSlot();
  }
};

export const runAnalyticsTask = async (task, payload = {}, options = {}) => {
  const timeoutMs = timeoutForTask(task, options.timeoutMs);
  const warnings = [];

  for (const pythonBin of candidateBins()) {
    try {
      const result = await runWithPythonBin(pythonBin, task, payload, timeoutMs);
      if (result.success) return result;
      warnings.push(result.message || "Python worker returned an analysis error.");
      break;
    } catch (error) {
      warnings.push(`${pythonBin}: ${error.message}`);
    }
  }

  return normalizeFallback(task, payload, warnings[0] || fallbackWarning);
};

export const analyzeScorecard = (payload, options) => runAnalyticsTask("analyze_scorecard", payload, options);
export const buildRhythm = (payload, options) => runAnalyticsTask("build_rhythm", payload, options);
export const rebuildGameplayGraph = (payload, options) => runAnalyticsTask("rebuild_gameplay_graph", payload, options);
export const computeTeammateFit = (payload, options) => runAnalyticsTask("compute_teammate_fit", payload, options);

let healthCache = null;
let healthCheckPromise = null;

const runAnalyticsHealth = async () => {
  const bins = candidateBins();
  const checks = [];
  const workerPathExists = fs.existsSync(workerPath);

  for (const pythonBin of bins) {
    try {
      const result = await runWithPythonBin(pythonBin, "build_rhythm", { sessions: [] }, 5000);
      checks.push({ pythonBin, available: Boolean(result.success), message: result.success ? "Python worker responded." : result.message });
      if (result.success) {
        return {
          pythonAvailable: true,
          pythonBin,
          workerPathExists,
          fallbackAvailable: true,
          environment: process.env.NODE_ENV || "development",
          checks
        };
      }
    } catch (error) {
      checks.push({ pythonBin, available: false, message: error.message });
    }
  }

  return {
    pythonAvailable: false,
    pythonBin: bins[0],
    workerPathExists,
    fallbackAvailable: true,
    environment: process.env.NODE_ENV || "development",
    checks
  };
};

export const analyticsHealth = async () => {
  if (healthCache && healthCache.expiresAt > Date.now()) return healthCache.data;
  if (healthCheckPromise) return healthCheckPromise;

  healthCheckPromise = runAnalyticsHealth()
    .then((data) => {
      healthCache = { data, expiresAt: Date.now() + 60 * 1000 };
      return data;
    })
    .finally(() => {
      healthCheckPromise = null;
    });

  return healthCheckPromise;
};
