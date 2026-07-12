const defaultTimeoutMs = 8000;
const defaultMaxResponseBytes = 5 * 1024 * 1024;

export const fetchJson = async (url, { timeoutMs = defaultTimeoutMs, maxResponseBytes = defaultMaxResponseBytes, headers = {} } = {}) => {
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

    const declaredLength = Number(response.headers.get("content-length"));
    if (Number.isFinite(declaredLength) && declaredLength > maxResponseBytes) {
      throw new Error("External API response is too large");
    }

    const payload = await response.arrayBuffer();
    if (payload.byteLength > maxResponseBytes) {
      throw new Error("External API response is too large");
    }

    try {
      return JSON.parse(new TextDecoder().decode(payload));
    } catch {
      throw new Error("External API returned invalid JSON");
    }
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
