'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn, formatContainer } from '@/lib/utils';
import {
  MAX_CONTAINERS,
  ehContainerIso6346,
  normalizarContainer,
  separarContainers,
} from '@/lib/containers';

/**
 * Entrada de vários containers, para a carga marítima.
 *
 * Existe porque a carga marítima quase sempre tem mais de um container — 62 dos
 * 101 lotes em estoque no SIAUM, o maior com 16 — e declarar um só escondia o
 * resto da carga na conferência do analista.
 *
 * Colar a lista inteira é o caminho principal: ela chega pronta do agente ou do
 * armador, e digitar 16 containers à mão é onde o erro aparece.
 */
export function ContainersInput({
  valores,
  onChange,
  desabilitado,
}: {
  valores: string[];
  onChange: (containers: string[]) => void;
  desabilitado?: boolean;
}) {
  const [rascunho, setRascunho] = useState('');

  const adicionar = (entrada: string) => {
    const novos = separarContainers(entrada).filter(
      (c) => !valores.includes(c),
    );
    if (!novos.length) return;
    onChange([...valores, ...novos].slice(0, MAX_CONTAINERS));
  };

  const confirmarRascunho = () => {
    if (!rascunho.trim()) return;
    adicionar(rascunho);
    setRascunho('');
  };

  const remover = (container: string) =>
    onChange(valores.filter((c) => c !== container));

  const invalidos = valores.filter((c) => !ehContainerIso6346(c));

  return (
    <div>
      <div
        className={cn(
          'mt-1 flex min-h-9 flex-wrap items-center gap-1.5 rounded-md border border-input p-1.5',
          desabilitado && 'opacity-60',
        )}
      >
        {valores.map((container) => {
          const valido = ehContainerIso6346(container);
          return (
            <span
              key={container}
              className={cn(
                'inline-flex items-center gap-1 rounded border px-2 py-0.5 font-mono text-xs',
                valido
                  ? 'border-transparent bg-muted'
                  : 'border-destructive/40 bg-destructive/10 text-destructive',
              )}
              // O inválido fica visível em vez de ser recusado na entrada: a
              // pessoa vê qual dos 16 está errado, em vez de perder a lista.
              title={valido ? container : 'Dígito verificador não confere'}
            >
              {container}
              <button
                type="button"
                onClick={() => remover(container)}
                disabled={desabilitado}
                aria-label={`Remover ${container}`}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          );
        })}

        <Input
          value={rascunho}
          disabled={desabilitado || valores.length >= MAX_CONTAINERS}
          onChange={(e) => setRascunho(formatContainer(e.target.value))}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === 'Tab' || e.key === ',') {
              if (!rascunho.trim()) return;
              // Enter aqui não pode submeter o formulário nem pular o campo.
              e.preventDefault();
              confirmarRascunho();
            }
            if (e.key === 'Backspace' && !rascunho && valores.length) {
              remover(valores[valores.length - 1]);
            }
          }}
          onPaste={(e) => {
            const texto = e.clipboardData.getData('text');
            if (!texto) return;
            e.preventDefault();
            adicionar(texto);
            setRascunho('');
          }}
          onBlur={confirmarRascunho}
          placeholder={valores.length ? '' : 'Ex: MSKU1234567'}
          className="h-6 flex-1 border-0 px-1 font-mono shadow-none focus-visible:ring-0"
          aria-label="Adicionar container"
        />
      </div>

      <p className="mt-1 text-xs text-muted-foreground">
        {valores.length
          ? `${valores.length} container${valores.length > 1 ? 's' : ''}`
          : 'Padrão ISO 6346: 4 letras + 7 dígitos.'}
        {' · '}
        Cole a lista inteira (separada por espaço, vírgula ou &quot;/&quot;) ou
        confirme cada um com Enter.
      </p>

      {invalidos.length > 0 && (
        <p className="mt-1 text-xs text-destructive">
          Dígito verificador não confere em: {invalidos.join(', ')}. Corrija ou
          remova antes de continuar.
        </p>
      )}
    </div>
  );
}

/** Normaliza o que veio de um campo de texto simples (conhecimento). */
export function comoConhecimento(valor: string): string {
  return normalizarContainer(valor);
}
