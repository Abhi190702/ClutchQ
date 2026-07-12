const hostnamePattern = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

const normalizeHostnameEntry = (entry) => {
  const value = String(entry || "").trim().toLowerCase();
  if (!value) return null;

  if (/^https?:\/\//.test(value)) {
    try {
      const parsed = new URL(value);
      if (parsed.username || parsed.password || parsed.search || parsed.hash || parsed.pathname !== "/") return null;
      return hostnamePattern.test(parsed.hostname) ? parsed.hostname : null;
    } catch {
      return null;
    }
  }

  const hostname = value.replace(/\.$/, "");
  return hostnamePattern.test(hostname) ? hostname : null;
};

export const resolveTurnstileAllowedHostnames = ({ configuredValue, clientUrl } = {}) => {
  const explicitEntries = String(configuredValue || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  const sourceEntries = explicitEntries.length ? explicitEntries : [clientUrl].filter(Boolean);
  const normalized = sourceEntries.map((entry) => normalizeHostnameEntry(entry));

  return {
    hostnames: [...new Set(normalized.filter(Boolean))],
    invalidEntries: sourceEntries.filter((entry, index) => !normalized[index])
  };
};

export const getTurnstileAllowedHostnames = () =>
  resolveTurnstileAllowedHostnames({
    configuredValue: process.env.TURNSTILE_ALLOWED_HOSTNAMES,
    clientUrl: process.env.CLIENT_URL
  }).hostnames;
