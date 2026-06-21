import React from 'react';

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  ATIVO:      { label: 'Agendado',    className: 'bg-blue-50 text-blue-700 border-blue-200' },
  AG_CHEGADA: { label: 'Ag. Chegada', className: 'bg-orange-50 text-orange-700 border-orange-200' },
  CHEGOU:     { label: 'Chegou',      className: 'bg-teal-50 text-teal-700 border-teal-200' },
  ON_TIME:    { label: 'On-time',     className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  ATRASADO:   { label: 'Atrasado',    className: 'bg-amber-50 text-amber-700 border-amber-200' },
  NO_SHOW:    { label: 'No-show',     className: 'bg-red-50 text-red-700 border-red-200' },
  CONCLUIDO:  { label: 'Concluído',   className: 'bg-zinc-100 text-zinc-600 border-zinc-200' },
  CANCELADO:  { label: 'Cancelado',   className: 'bg-zinc-100 text-zinc-400 border-zinc-200' },
};

export function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] ?? { label: status, className: 'bg-zinc-100 text-zinc-500 border-zinc-200' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${s.className}`}>
      {s.label}
    </span>
  );
}

export function getStatusLabel(status: string): string {
  return STATUS_MAP[status]?.label ?? status;
}
