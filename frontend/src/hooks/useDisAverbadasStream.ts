'use client';

import { useEffect, useRef } from 'react';
import { DI } from '@/types/agendamento';
import { connectEventStream } from '@/lib/event-stream';

export function useDisAverbadasStream(enabled: boolean, onEvent: (di: DI) => void) {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!enabled) return;
    return connectEventStream<DI>('/api/dis-averbadas/stream', data => onEventRef.current(data));
  }, [enabled]);
}
