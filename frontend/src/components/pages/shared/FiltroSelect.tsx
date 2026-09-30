'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/orion/ui';
import { cn } from '@/lib/utils';

export interface OpcaoFiltro {
  value: string;
  label: string;
}

/**
 * Filtro de lista fechada sobre o `Select` do Orion (Base UI). Usado nos
 * filtros de cliente e modalidade das telas de Averbação e da dashboard de
 * agendamento, para os dois terem o mesmo controle.
 *
 * `items` vai também para o `SelectValue`: é ele que mostra o rótulo, e não o
 * valor cru, no gatilho fechado.
 */
export function FiltroSelect({
  value,
  onChange,
  opcoes,
  ariaLabel,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  opcoes: OpcaoFiltro[];
  ariaLabel: string;
  className?: string;
}) {
  return (
    <Select
      value={value}
      onValueChange={(v) => {
        if (typeof v === 'string') onChange(v);
      }}
      items={opcoes}
    >
      <SelectTrigger aria-label={ariaLabel} className={cn('w-56', className)}>
        <SelectValue items={opcoes} />
      </SelectTrigger>
      <SelectContent>
        {opcoes.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
