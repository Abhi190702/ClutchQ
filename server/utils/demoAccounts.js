export const sharedDemoEmails = new Set([
  "demo@clutchq.com",
  "captain@clutchq.com",
  "sentinel@clutchq.com",
  "flex@clutchq.com"
]);

export const isSharedDemoEmail = (email) => sharedDemoEmails.has(String(email || "").trim().toLowerCase());
export const isSharedDemoUser = (user) => isSharedDemoEmail(user?.email);
