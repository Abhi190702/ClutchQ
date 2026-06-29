import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runFallbackTask } from "./fallbackAnalyticsService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../..");
const workerPath = path.join(projectRoot, "analytics-worker", "main.py");

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
  if (warning && !warnings.includes(warning)) warnings.push(`Worker detail: ${warning}`);
  return {
    ...fallback,
    warnings,
    source: "fallback"
  };
};

const runWithPythonBin = (pythonBin, task, payload, timeoutMs) =>
  new Promise((resolve, reject) => {
    const child = spawn(pythonBin, [workerPath], {
      cwd: projectRoot,
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true
    });

    let stdout = "";
    let stderr = "";
    let settled = false;

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      child.kill("SIGKILL");
      reject(new Error("Python analytics worker timed out."));
    }, timeoutMs);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
      if (stdout.length > 1024 * 1024) {
        child.kill("SIGKILL");
      }
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(error);
    });

    child.on("close", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);

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

    child.stdin.end(JSON.stringify({ task, payload }));
  });

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

export const analyticsHealth = async () => {
  const bins = candidateBins();
  const checks = [];

  for (const pythonBin of bins) {
    try {
      const result = await runWithPythonBin(pythonBin, "build_rhythm", { sessions: [] }, 5000);
      checks.push({ pythonBin, available: Boolean(result.success), message: result.success ? "Python worker responded." : result.message });
      if (result.success) {
        return {
          pythonAvailable: true,
          pythonBin,
          fallbackAvailable: true,
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
    fallbackAvailable: true,
    checks
  };
};
