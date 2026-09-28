import React from 'react';
import { getStatusLabel, getStatusVisual } from '@/lib/agendamento-status';

export function StatusBadge({ status }: { status: string }) {
  const s = getStatusVisual(status);
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${s.className}`}>
      {s.label}
    </span>
  );
}

export { getStatusLabel };
