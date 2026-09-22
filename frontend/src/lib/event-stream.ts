export function connectEventStream<T>(
  path: string,
  onEvent: (data: T) => void,
  // Necessario quando a API esta em outra origem (dev: :3001 -> :5001); sem
  // isso o cookie httpOnly da sessao nao viaja e o stream volta 401.
  options?: { withCredentials?: boolean },
): () => void {
  let source: EventSource | null = null;
  let retryTimer: ReturnType<typeof setTimeout> | undefined;
  let stopped = false;
  let retries = 0;
  const scheduleRetry = () => {
    if (stopped || retries >= 5) return;
    retryTimer = setTimeout(connect, Math.min(5_000 * 2 ** retries++, 60_000));
  };
  const connect = () => {
    if (stopped) return;
    source = options?.withCredentials
      ? new EventSource(path, { withCredentials: true })
      : new EventSource(path);
    source.onmessage = event => {
      try {
        const data = JSON.parse(event.data) as T;
        retries = 0;
        onEvent(data);
      } catch { /* Ignore malformed payload. */ }
    };
    source.onerror = () => {
      if (source) source.onerror = null;
      source?.close();
      source = null;
      scheduleRetry();
    };
  };
  connect();
  return () => {
    stopped = true;
    if (retryTimer) clearTimeout(retryTimer);
    source?.close();
  };
}
