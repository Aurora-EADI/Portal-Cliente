'use client';

import { useRouter } from 'next/navigation';
import { FileCheck, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAverbacoes } from '@/hooks/useAverbacoes';
import {
  MODALIDADE_LABEL,
  ProcessoStatus,
  progressoObrigatorios,
} from '@/types/averbacao';
import { ProgressoObrigatorios, StatusProcesso } from './StatusBadges';

function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR');
}

export function AverbacoesListPage({ podeCriar }: { podeCriar: boolean }) {
  const router = useRouter();
  const { data, isLoading } = useAverbacoes();
  const processos = data ?? [];

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-foreground">
            Averbação Aduaneira
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Liberação documental da DI/DUIMP. O agendamento só abre quando todos
            os documentos obrigatórios estiverem validados pela equipe da Aurora.
          </p>
        </div>
        {podeCriar && (
          <Button onClick={() => router.push('/averbacao/novo')} className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Averbação
          </Button>
        )}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : processos.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-10 text-center">
          <FileCheck className="h-8 w-8 text-muted-foreground" aria-hidden />
          <p className="text-sm font-medium">Nenhum processo de averbação</p>
          <p className="max-w-md text-sm text-muted-foreground">
            {podeCriar
              ? 'Abra um processo para enviar os documentos exigidos pela modalidade.'
              : 'Os processos abertos pelo seu despachante aparecerão aqui.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {processos.map((p) => {
            const progresso = progressoObrigatorios(p.documentos);
            return (
              <Card
                key={p.id}
                className="cursor-pointer transition-colors hover:border-primary/50"
                onClick={() => router.push(`/averbacao/${p.id}`)}
              >
                <CardContent className="space-y-3 pt-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono text-sm font-semibold">
                        {p.protocolo}
                      </p>
                      <p className="truncate text-sm text-foreground">
                        {p.cliente.nome}
                      </p>
                    </div>
                    <StatusProcesso status={p.status} />
                  </div>

                  <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <div>
                      <dt className="inline">DI/DUIMP: </dt>
                      <dd className="inline font-mono text-foreground">
                        {p.diDuimp}
                      </dd>
                    </div>
                    <div>
                      <dt className="inline">Modalidade: </dt>
                      <dd className="inline text-foreground">
                        {MODALIDADE_LABEL[p.modalidade]}
                      </dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="inline">Container/Conhecimento: </dt>
                      <dd className="inline font-mono text-foreground">
                        {p.containerConhecimento}
                      </dd>
                    </div>
                  </dl>

                  <div className="flex items-end justify-between gap-4 border-t pt-3">
                    <ProgressoObrigatorios {...progresso} />
                    <span className="text-[11px] text-muted-foreground">
                      {p.status === ProcessoStatus.LIBERADO_AGENDAMENTO && p.nLote
                        ? `Lote ${p.nLote}`
                        : `Aberto em ${formatarData(p.createdAt)}`}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
