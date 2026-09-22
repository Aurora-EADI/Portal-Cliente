'use client';

import { useEffect, useRef } from 'react';
import { DI } from '@/types/agendamento';
import { connectEventStream } from '@/lib/event-stream';

/** Remoção: a DI foi desaverbada no Aurora e deve sair do dashboard. */
export interface DiRemovida {
  nLote: string;
  removida: true;
}

export type DiAverbadaStreamEvent = DI | DiRemovida;

export function useDisAverbadasStream(
  enabled: boolean,
  onEvent: (evento: DiAverbadaStreamEvent) => void,
) {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!enabled) return;
    return connectEventStream<DiAverbadaStreamEvent>(
      '/api/dis-averbadas/stream',
      data => onEventRef.current(data),
    );
  }, [enabled]);
}
