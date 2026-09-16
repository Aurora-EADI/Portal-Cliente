'use client';

import { useEffect, useRef } from 'react';
import { connectEventStream } from '@/lib/event-stream';

export function useAgendamentoStream(enabled: boolean, onEvent: (payload: unknown) => void) {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!enabled) return;
    return connectEventStream('/api/agendamento/stream', data => onEventRef.current(data));
  }, [enabled]);
}
