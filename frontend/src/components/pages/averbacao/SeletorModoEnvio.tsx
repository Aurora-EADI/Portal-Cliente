'use client';

import { FileStack, Files } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ModoEnvio = 'individual' | 'unico';

const MODOS_ENVIO: {
  valor: ModoEnvio;
  Icon: typeof Files;
  titulo: string;
  descricao: string;
}[] = [
  {
    valor: 'individual',
    Icon: Files,
    titulo: 'Um arquivo por documento',
    descricao: 'Anexe cada documento separadamente.',
  },
  {
    valor: 'unico',
    Icon: FileStack,
    titulo: 'Arquivo único',
    descricao: 'Todos os obrigatórios em um só PDF.',
  },
];

/**
 * Escolha entre anexar documento a documento ou um PDF com todos. Usado na
 * criação e no detalhe do processo, para a escolha não sumir quando a pessoa
 * fecha o modal de criação e volta depois para terminar o envio.
 */
export function SeletorModoEnvio({
  modo,
  onChange,
  bloqueado = false,
}: {
  modo: ModoEnvio;
  onChange: (modo: ModoEnvio) => void;
  /** Depois do arquivo único enviado não há mais o que alternar. */
  bloqueado?: boolean;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Forma de envio dos documentos"
      className="grid gap-3 sm:grid-cols-2"
    >
      {MODOS_ENVIO.map(({ valor, Icon, titulo, descricao }) => {
        const ativo = modo === valor;
        return (
          <button
            key={valor}
            type="button"
            role="radio"
            aria-checked={ativo}
            disabled={bloqueado && !ativo}
            onClick={() => onChange(valor)}
            className={cn(
              'relative flex items-start gap-3 rounded-lg border p-3 text-left transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              ativo
                ? 'border-primary bg-primary/5'
                : 'hover:border-muted-foreground/40 hover:bg-muted/40',
              'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-border disabled:hover:bg-transparent',
            )}
          >
            <span
              className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                ativo
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground',
              )}
            >
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block font-medium">{titulo}</span>
              <span className="block text-xs text-muted-foreground">
                {descricao}
              </span>
            </span>
            {ativo && (
              <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-primary" />
            )}
          </button>
        );
      })}
    </div>
  );
}
