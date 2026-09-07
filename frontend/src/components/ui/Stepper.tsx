'use client';

import * as React from 'react';
import { AlertCircle, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Indicador de etapas. Nasceu para os 3 steps da averbacao, mas nao assume
 * quantidade: recebe os steps e o indice atual.
 *
 * O estado de cada etapa e derivado, nao guardado em dois lugares: tudo antes
 * do indice atual esta concluido, salvo o que estiver listado em `comErro`.
 */

export interface Step {
  id: string | number;
  label: string;
  description?: string;
}

export interface StepperProps {
  steps: Step[];
  /** Indice da etapa atual (base 0). */
  current: number;
  /** Indices com pendencia — ex.: documento obrigatorio rejeitado. */
  comErro?: number[];
  /** Habilita voltar para etapas ja visitadas. Sem isso, o Stepper e so visual. */
  onStepClick?: (index: number) => void;
  className?: string;
}

type EstadoEtapa = 'concluida' | 'atual' | 'erro' | 'futura';

function estadoDa(index: number, current: number, comErro: number[]): EstadoEtapa {
  if (comErro.includes(index)) return 'erro';
  if (index < current) return 'concluida';
  if (index === current) return 'atual';
  return 'futura';
}

const circuloPorEstado: Record<EstadoEtapa, string> = {
  concluida: 'border-primary bg-primary text-primary-foreground',
  atual: 'border-primary bg-background text-primary',
  erro: 'border-destructive bg-destructive text-destructive-foreground',
  futura: 'border-input bg-background text-muted-foreground',
};

const rotuloPorEstado: Record<EstadoEtapa, string> = {
  concluida: 'text-foreground',
  atual: 'text-foreground font-semibold',
  erro: 'text-destructive font-medium',
  futura: 'text-muted-foreground',
};

export function Stepper({
  steps,
  current,
  comErro = [],
  onStepClick,
  className,
}: StepperProps) {
  return (
    <ol
      className={cn('flex w-full flex-col gap-4 sm:flex-row sm:items-start', className)}
      aria-label="Etapas"
    >
      {steps.map((step, index) => {
        const estado = estadoDa(index, current, comErro);
        const navegavel = Boolean(onStepClick) && index <= current;
        const ultima = index === steps.length - 1;

        const miolo = (
          <>
            <span
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors',
                circuloPorEstado[estado],
              )}
              aria-hidden
            >
              {estado === 'concluida' ? (
                <Check className="h-4 w-4" />
              ) : estado === 'erro' ? (
                <AlertCircle className="h-4 w-4" />
              ) : (
                index + 1
              )}
            </span>
            <span className="min-w-0 text-left">
              <span className={cn('block text-sm leading-tight', rotuloPorEstado[estado])}>
                {step.label}
              </span>
              {step.description && (
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {step.description}
                </span>
              )}
            </span>
          </>
        );

        return (
          <li
            key={step.id}
            className="flex flex-1 items-start gap-3 sm:flex-col sm:gap-2"
            aria-current={estado === 'atual' ? 'step' : undefined}
          >
            <div className="flex w-full items-start gap-3">
              {navegavel ? (
                <button
                  type="button"
                  onClick={() => onStepClick?.(index)}
                  className="flex items-start gap-3 rounded text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {miolo}
                </button>
              ) : (
                <div className="flex items-start gap-3">{miolo}</div>
              )}

              {/* Conector: some na ultima etapa e no empilhamento mobile. */}
              {!ultima && (
                <span
                  className={cn(
                    'mt-4 hidden h-0.5 flex-1 rounded sm:block',
                    index < current ? 'bg-primary' : 'bg-input',
                  )}
                  aria-hidden
                />
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
