'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAverbacao } from '@/hooks/useAverbacoes';
import {
  AverbacaoDetalheConteudo,
  CabecalhoProcesso,
} from './AverbacaoDetalheConteudo';

/**
 * Página do processo. O caminho normal é o modal aberto pela lista; esta rota
 * continua existindo como link direto — para compartilhar um processo ou voltar
 * a ele pelo histórico do browser.
 *
 * O miolo é o mesmo componente do modal: duas telas com o mesmo conteúdo
 * duplicado envelheceriam em ritmos diferentes.
 */
export function AverbacaoDetalhePage({ id }: { id: string }) {
  const router = useRouter();
  const { data: processo, isLoading, isError } = useAverbacao(id);

  if (isLoading) {
    return <p className="p-6 text-sm text-muted-foreground">Carregando…</p>;
  }
  if (isError || !processo) {
    return (
      <p className="p-6 text-sm text-destructive">
        Não foi possível carregar este processo.
      </p>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5 p-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push('/averbacao')}
        className="gap-1 px-0"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Button>

      <CabecalhoProcesso processo={processo} />
      <AverbacaoDetalheConteudo processo={processo} />
    </div>
  );
}
