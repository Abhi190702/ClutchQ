export const isLocalDevelopment = () => {
  const hostedRuntime = Boolean(
    process.env.RENDER ||
      process.env.RENDER_EXTERNAL_URL ||
      process.env.VERCEL ||
      process.env.VERCEL_URL ||
      process.env.RAILWAY_ENVIRONMENT ||
      process.env.FLY_APP_NAME
  );
  if (hostedRuntime) return false;

  const launchedWithDevScript = process.env.npm_lifecycle_event === "dev";
  if (launchedWithDevScript) return true;
  return process.env.NODE_ENV !== "production";
};

export const isProductionRuntime = () => !isLocalDevelopment();
