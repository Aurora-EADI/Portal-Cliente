'use client';

import { cn } from '@/lib/utils';

/** O documento de saída do processo: DI (legada) ou DUIMP (Portal Único). */
export type TipoDocumentoSaida = 'DI' | 'DUIMP';

/** Só dígitos, formatando como XX/XXXXXXX-X enquanto digita. */
function mascararDi(valor: string): string {
  const d = valor.replace(/\D/g, '').slice(0, 10);
  if (d.length <= 2) return d;
  if (d.length <= 9) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 9)}-${d.slice(9)}`;
}

/**
 * Só dígitos, formatando como XXBRXXXXXXXXXX-X (ex.: 26BR0000349821-3). O "BR"
 * é fixo da DUIMP, então entra sozinho depois do ano — quem digita não precisa
 * trocar de teclado no meio do número.
 */
function mascararDuimp(valor: string): string {
  const d = valor.replace(/\D/g, '').slice(0, 13);
  if (d.length <= 2) return d;
  if (d.length <= 12) return `${d.slice(0, 2)}BR${d.slice(2)}`;
  return `${d.slice(0, 2)}BR${d.slice(2, 12)}-${d.slice(12)}`;
}

export const DOCUMENTO_SAIDA: Record<
  TipoDocumentoSaida,
  {
    rotulo: string;
    // A spec pede ^\d{2}/\d{9}$, mas as DIs reais têm dígito verificador
    // (22/2564365-1). O backend aceita as duas; a máscara aqui segue a real.
    regex: RegExp;
    mascarar: (valor: string) => string;
    placeholder: string;
    formato: string;
  }
> = {
  DI: {
    rotulo: 'DI',
    regex: /^\d{2}\/(\d{7}-\d|\d{9})$/,
    mascarar: mascararDi,
    placeholder: '00/0000000-0',
    formato: 'XX/XXXXXXX-X',
  },
  DUIMP: {
    rotulo: 'DUIMP',
    regex: /^\d{2}BR\d{10}-\d$/,
    mascarar: mascararDuimp,
    placeholder: '00BR0000000000-0',
    formato: 'XXBRXXXXXXXXXX-X',
  },
};

/** Reconhece um número já gravado — o processo não guarda o tipo à parte. */
export function tipoDocumentoSaida(valor: string): TipoDocumentoSaida {
  return /^\d{2}BR/i.test(valor) ? 'DUIMP' : 'DI';
}

export function documentoSaidaValido(
  tipo: TipoDocumentoSaida,
  valor: string,
): boolean {
  return DOCUMENTO_SAIDA[tipo].regex.test(valor);
}

/** Alternância DI | DUIMP acima do campo do número. */
export function SeletorDocumentoSaida({
  tipo,
  onChange,
  idCampo,
}: {
  tipo: TipoDocumentoSaida;
  onChange: (tipo: TipoDocumentoSaida) => void;
  /** Campo do número, para o foco voltar a ele depois da troca. */
  idCampo?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Tipo do documento de saída"
      className="inline-flex h-9 shrink-0 items-stretch rounded-md border bg-muted/40 p-0.5"
    >
      {(Object.keys(DOCUMENTO_SAIDA) as TipoDocumentoSaida[]).map((valor) => {
        const ativo = tipo === valor;
        return (
          <button
            key={valor}
            type="button"
            role="radio"
            aria-checked={ativo}
            onClick={() => {
              onChange(valor);
              if (idCampo) document.getElementById(idCampo)?.focus();
            }}
            className={cn(
              'rounded px-3 text-xs font-medium transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              ativo
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {DOCUMENTO_SAIDA[valor].rotulo}
          </button>
        );
      })}
    </div>
  );
}
