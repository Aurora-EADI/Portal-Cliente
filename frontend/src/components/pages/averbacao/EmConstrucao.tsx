'use client';

import { Construction } from 'lucide-react';

/**
 * Marcador temporario das telas de averbacao.
 *
 * As rotas, os guards e o menu ja sobem nesta entrega (P7) para fixar a
 * convencao de rota-por-segmento antes de existir codigo para migrar. O
 * conteudo chega nas Fases 2 (procuracoes) e 3 (averbacao).
 */
export function EmConstrucao({ titulo, descricao }: { titulo: string; descricao: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 p-8 text-center">
      <Construction className="h-10 w-10 text-primary-500" aria-hidden />
      <h1 className="text-lg font-semibold text-foreground">{titulo}</h1>
      <p className="max-w-md text-sm text-muted-foreground">{descricao}</p>
    </div>
  );
}
