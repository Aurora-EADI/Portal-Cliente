'use client';

import { useEffect, useRef } from 'react';

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

      // Same-origin: o cookie httpOnly de sessao vai junto sozinho. Sem token
      // na URL — ela aparece em log de proxy e access log.
      source = new EventSource('/api/agendamento/stream');

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
