import { isProductionRuntime } from "./runtimeEnv.js";

export const assertDestructiveScriptAllowed = (flagName, actionLabel) => {
  if (!isProductionRuntime() || process.env[flagName] === "true") return;

  throw new Error(
    `${actionLabel} is blocked in production. Set ${flagName}=true only for the single intentional run, then remove it.`
  );
};
