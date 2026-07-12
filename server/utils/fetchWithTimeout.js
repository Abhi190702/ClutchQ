const DEFAULT_TIMEOUT_MS = 10000;

export class ExternalRequestTimeoutError extends Error {
  constructor(message = "External service request timed out.") {
    super(message);
    this.name = "ExternalRequestTimeoutError";
    this.statusCode = 504;
  }
}

export const fetchWithTimeout = async (url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new ExternalRequestTimeoutError();
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
};
