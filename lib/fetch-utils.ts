const DEFAULT_FETCH_TIMEOUT_MS = 60_000;

function linkAbortSignals(signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController();
  for (const signal of signals) {
    if (signal.aborted) {
      controller.abort(signal.reason);
      return controller.signal;
    }
    signal.addEventListener('abort', () => controller.abort(signal.reason), { once: true });
  }
  return controller.signal;
}

export async function fetchWithTimeout(
  url: string,
  init: RequestInit = {},
  options: { timeoutMs?: number; signal?: AbortSignal } = {}
): Promise<Response> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_FETCH_TIMEOUT_MS;
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(new Error('Request timed out')), timeoutMs);

  const signals = [timeoutController.signal];
  if (options.signal) signals.push(options.signal);
  if (init.signal) signals.push(init.signal);

  try {
    return await fetch(url, {
      ...init,
      signal: linkAbortSignals(signals),
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out or was cancelled');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
