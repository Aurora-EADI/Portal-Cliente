'use client';

import { useEffect, useRef } from 'react';
import Cookies from 'js-cookie';

const RETRY_DELAY_MS = 5_000;

export function useAgendamentoStream(enabled: boolean, onEvent: (payload: any) => void) {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!enabled) return;

    let source: EventSource | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let stopped = false;

    const connect = () => {
      if (stopped) return;
      const token = Cookies.get('access_token');
      if (!token) {
        retryTimer = setTimeout(connect, RETRY_DELAY_MS);
        return;
      }

      source = new EventSource(`/api/agendamento/stream?token=${encodeURIComponent(token)}`);

      source.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          onEventRef.current(payload);
        } catch {
          // ignore malformed payload
        }
      };

      source.onerror = () => {
        source?.close();
        source = null;
        if (!stopped) retryTimer = setTimeout(connect, RETRY_DELAY_MS);
      };
    };

    connect();

    return () => {
      stopped = true;
      if (retryTimer) clearTimeout(retryTimer);
      source?.close();
    };
  }, [enabled]);
}
