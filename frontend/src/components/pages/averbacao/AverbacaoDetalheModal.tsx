'use client';

import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAverbacao } from '@/hooks/useAverbacoes';
import {
  AverbacaoDetalheConteudo,
  CabecalhoProcesso,
} from './AverbacaoDetalheConteudo';

/**
 * Detalhe do processo sem sair da lista.
 *
 * `processoId` nulo mantém a query parada (o hook já tem `enabled`), então o
 * modal fechado não busca nada.
 */
export function AverbacaoDetalheModal({
  processoId,
  onClose,
}: {
  processoId: string | null;
  onClose: () => void;
}) {
  const { data: processo, isLoading, isError } = useAverbacao(processoId ?? '');

  return (
    <Dialog open={processoId !== null} onOpenChange={(a) => !a && onClose()}>
      {/* Coluna flex em vez do grid padrão do DialogContent: assim o rodapé
          fica fixo e só o miolo rola. */}
      <DialogContent className="flex max-h-[88vh] max-w-5xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b px-6 py-4 text-left">
          {processo ? (
            <CabecalhoProcesso processo={processo} />
          ) : (
            <DialogTitle>Detalhes da averbação</DialogTitle>
          )}
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <p className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando…
            </p>
          ) : isError || !processo ? (
            <p className="py-10 text-sm text-destructive">
              Não foi possível carregar este processo.
            </p>
          ) : (
            <AverbacaoDetalheConteudo processo={processo} />
          )}
        </div>

        <DialogFooter className="shrink-0 border-t px-6 py-3">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
