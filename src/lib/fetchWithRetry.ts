"use client";

/**
 * fetchWithRetry
 *
 * Wrapper around the native fetch that implements simple retry logic for
 * HTTP 429 (Too Many Requests) responses. It respects the `Retry-After`
 * header when present and falls back to exponential back‑off otherwise.
 *
 * @param input      Request URL or Request object.
 * @param init       Optional fetch init options.
 * @param maxRetries Maximum retry attempts (default: 3).
 * @param backoffMs  Base back‑off in milliseconds (default: 500).
 * @returns          The successful Response object.
 */
export async function fetchWithRetry(
  input: RequestInfo,
  init?: RequestInit,
  maxRetries: number = 3,
  backoffMs: number = 500
): Promise<Response> {
  let attempt = 0;
  while (true) {
    const response = await fetch(input, init);
    if (!response.ok && response.status === 429 && attempt < maxRetries) {
      // Respect Retry‑After header if server provided one.
      const retryAfter = response.headers.get('Retry-After');
      let delay = backoffMs * Math.pow(2, attempt);
      if (retryAfter) {
        const parsed = parseInt(retryAfter, 10);
        if (!isNaN(parsed)) {
          delay = parsed * 1000; // Retry‑After is in seconds.
        } else {
          // Retry‑After can be a HTTP‑date.
          const date = new Date(retryAfter);
          if (!isNaN(date.getTime())) {
            delay = date.getTime() - Date.now();
          }
        }
      }
      await new Promise((resolve) => setTimeout(resolve, Math.max(delay, 0)));
      attempt++;
      continue;
    }
    return response;
  }
}
