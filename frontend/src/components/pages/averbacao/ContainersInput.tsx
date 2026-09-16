'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
 * O caminho principal é adicionar um a um, com botão visível: sem ele a pessoa
 * digita o container e não sabe o que fazer em seguida. Colar a lista inteira
 * continua funcionando, porque ela costuma chegar pronta do agente ou do
 * armador, e digitar 16 à mão é onde o erro aparece.
 */
export function ContainersInput({
  id,
  valores,
  onChange,
  desabilitado,
}: {
  id?: string;
  valores: string[];
  onChange: (containers: string[]) => void;
  desabilitado?: boolean;
}) {
  const [rascunho, setRascunho] = useState('');
  const [aviso, setAviso] = useState<string | null>(null);

  const cheio = valores.length >= MAX_CONTAINERS;

  const adicionarVarios = (texto: string) => {
    const novos = separarContainers(texto).filter((c) => !valores.includes(c));
    if (!novos.length) return;
    onChange([...valores, ...novos].slice(0, MAX_CONTAINERS));
    setRascunho('');
    setAviso(null);
  };

  const adicionar = () => {
    const container = normalizarContainer(rascunho);
    if (!container) return;

    if (valores.includes(container)) {
      setAviso(`${container} já está na lista.`);
      setRascunho('');
      return;
    }
    // Recusar na entrada evita a lista com item vermelho que trava o avanço
    // sem a pessoa entender qual dos 16 está errado.
    if (!ehContainerIso6346(container)) {
      setAviso(
        `${container} não confere: verifique o dígito verificador (ISO 6346).`,
      );
      return;
    }

    onChange([...valores, container]);
    setRascunho('');
    setAviso(null);
  };

  const remover = (container: string) => {
    onChange(valores.filter((c) => c !== container));
    setAviso(null);
  };

  const prontoParaAdicionar = normalizarContainer(rascunho).length === 11;

  return (
    <div className="mt-1 space-y-2">
      <div className="flex gap-2">
        <Input
          id={id}
          value={rascunho}
          disabled={desabilitado || cheio}
          onChange={(e) => {
            setRascunho(formatContainer(e.target.value));
            setAviso(null);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              // Enter aqui adiciona; sem isto submeteria o formulário.
              e.preventDefault();
              adicionar();
            }
          }}
          onPaste={(e) => {
            const texto = e.clipboardData.getData('text');
            if (!texto) return;
            e.preventDefault();
            adicionarVarios(texto);
          }}
          placeholder="Ex: MSKU1234567"
          maxLength={11}
          className="font-mono uppercase"
          aria-label="Número do container"
        />
        <Button
          type="button"
          variant="outline"
          className="shrink-0 gap-1.5"
          disabled={desabilitado || cheio || !prontoParaAdicionar}
          onClick={adicionar}
        >
          <Plus className="h-4 w-4" aria-hidden />
          Adicionar
        </Button>
      </div>

      {valores.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 rounded-md border bg-muted/30 p-2">
          {valores.map((container) => (
            <span
              key={container}
              className="inline-flex items-center gap-1 rounded border bg-background px-2 py-0.5 font-mono text-xs"
            >
              {container}
              <button
                type="button"
                onClick={() => remover(container)}
                disabled={desabilitado}
                aria-label={`Remover ${container}`}
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <span className="ml-auto text-xs text-muted-foreground">
            {valores.length} container{valores.length > 1 ? 's' : ''}
          </span>
        </div>
      )}

      <p
        className={cn(
          'text-xs',
          aviso ? 'text-destructive' : 'text-muted-foreground',
        )}
      >
        {aviso ??
          (cheio
            ? `Limite de ${MAX_CONTAINERS} containers atingido.`
            : 'Digite o container e clique em Adicionar (ou tecle Enter). Para vários de uma vez, cole a lista inteira.')}
      </p>
    </div>
  );
}
