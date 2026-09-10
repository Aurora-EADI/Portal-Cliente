import Cookies from 'js-cookie';

export function connectEventStream<T>(path: string, onEvent: (data: T) => void): () => void {
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
    const token = Cookies.get('access_token');
    if (!token) {
      scheduleRetry();
      return;
    }
    source = new EventSource(`${path}?token=${encodeURIComponent(token)}`);
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
