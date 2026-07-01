const defaultTimeoutMs = 8000;

export const fetchJson = async (url, { timeoutMs = defaultTimeoutMs, headers = {} } = {}) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "ClutchQ/1.0 game metadata cache",
        ...headers
      },
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`External API returned ${response.status}`);
    }

    return response.json();
  } finally {
    clearTimeout(timer);
  }
};

export const normalizeList = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean).map((item) => String(item).trim()).filter(Boolean);
  if (!value) return [];
  return String(value)
    .split(/[,;/]/)
    .map((item) => item.trim())
    .filter(Boolean);
};
