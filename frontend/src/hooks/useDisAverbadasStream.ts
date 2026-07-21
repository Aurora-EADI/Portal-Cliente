'use client';

import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { DI } from '@/types/agendamento';

const RETRY_DELAY_MS = 5_000;

export function useDisAverbadasStream(enabled: boolean, onEvent: (di: DI) => void) {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!enabled) return;

    let source: EventSource | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let stopped = false;

    const connect = async () => {
      if (stopped) return;
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        retryTimer = setTimeout(connect, RETRY_DELAY_MS);
        return;
      }

      source = new EventSource(`/api/dis-averbadas/stream?token=${encodeURIComponent(token)}`);

      source.onmessage = (event) => {
        try {
          const di = JSON.parse(event.data) as DI;
          onEventRef.current(di);
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
