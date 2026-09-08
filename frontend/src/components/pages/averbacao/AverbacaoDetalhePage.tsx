'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ExternalLink, History, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileUpload } from '@/components/ui/FileUpload';
import { averbacoesService } from '@/services/averbacoes.service';
import { useAverbacao, useEnviarDocumento } from '@/hooks/useAverbacoes';
import {
  AverbacaoDocumento,
  DocumentoStatus,
  HISTORICO_ACAO_LABEL,
  MODALIDADE_LABEL,
  ProcessoStatus,
  progressoObrigatorios,
} from '@/types/averbacao';
import { ProgressoObrigatorios, StatusDocumento, StatusProcesso } from './StatusBadges';

function formatarDataHora(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

function CartaoDocumento({
  documento,
  processoId,
  somenteLeitura,
}: {
  documento: AverbacaoDocumento;
  processoId: string;
  somenteLeitura: boolean;
}) {
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [historicoAberto, setHistoricoAberto] = useState(false);
  const { mutateAsync: enviar, isPending } = useEnviarDocumento(processoId);

  // Validado não aceita substituição — o backend recusa, e oferecer o campo
  // aqui só produziria um erro depois do upload.
  const podeEnviar =
    !somenteLeitura && documento.status !== DocumentoStatus.VALIDADO;

  const submeter = async () => {
    if (!arquivo) return;
    setErro(null);
    try {
      await enviar({ tipoDocumentoId: documento.tipoDocumento.id, arquivo });
      setArquivo(null);
      toast.success(`${documento.tipoDocumento.descricao} enviado para análise.`);
    } catch (e: any) {
      const m = e?.response?.data?.message;
      setErro(Array.isArray(m) ? m.join(', ') : m || 'Falha ao enviar.');
    }
  };

  const historico = documento.historico ?? [];

  return (
    <Card>
      <CardContent className="space-y-3 pt-6">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-medium">{documento.tipoDocumento.descricao}</p>
            <p className="text-xs text-muted-foreground">
              {documento.tipoDocumento.obrigatorio ? 'Obrigatório' : 'Opcional'}
            </p>
          </div>
          <StatusDocumento status={documento.status} />
        </div>

        {documento.status === DocumentoStatus.REJEITADO &&
          documento.motivoRejeicao && (
            <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3">
              <p className="text-xs font-medium text-destructive">
                Motivo da rejeição
              </p>
              <p className="mt-1 text-sm">{documento.motivoRejeicao}</p>
            </div>
          )}

        {documento.arquivoNome && (
          <a
            href={averbacoesService.urlArquivo(documento.id)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {documento.arquivoNome}
          </a>
        )}

        {podeEnviar && (
          <div className="space-y-2">
            <FileUpload
              value={arquivo}
              onChange={(f) => {
                setArquivo(f);
                setErro(null);
              }}
              accept={['application/pdf']}
              label={
                documento.arquivoNome ? 'Substituir documento' : 'Anexar documento'
              }
              hint="Arraste o PDF ou clique para escolher"
              error={erro}
            />
            {arquivo && (
              <Button
                size="sm"
                onClick={submeter}
                disabled={isPending}
                className="w-full"
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enviar para análise
              </Button>
            )}
          </div>
        )}

        {historico.length > 0 && (
          <div className="border-t pt-2">
            <button
              type="button"
              onClick={() => setHistoricoAberto((v) => !v)}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <History className="h-3.5 w-3.5" />
              {historicoAberto ? 'Ocultar' : 'Ver'} histórico ({historico.length})
            </button>
            {historicoAberto && (
              <ol className="mt-2 space-y-2 border-l pl-3">
                {historico.map((h) => (
                  <li key={h.id} className="text-xs">
                    <div className="flex flex-wrap items-baseline gap-x-2">
                      <span className="font-medium">
                        {HISTORICO_ACAO_LABEL[h.acao]}
                      </span>
                      <span className="text-muted-foreground">
                        {h.autorNome} · {formatarDataHora(h.criadoEm)}
                      </span>
                    </div>
                    {h.arquivoNome && (
                      <p className="font-mono text-[11px] text-muted-foreground">
                        {h.arquivoNome}
                      </p>
                    )}
                    {h.motivo && <p className="mt-0.5">{h.motivo}</p>}
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function AverbacaoDetalhePage({ id }: { id: string }) {
  const router = useRouter();
  const { data: processo, isLoading, isError } = useAverbacao(id);

  const porEtapa = useMemo(() => {
    if (!processo) return [];
    // "step" deixou de ser etapa de wizard e virou seção da mesma página.
    const grupos = new Map<number, AverbacaoDocumento[]>();
    processo.documentos.forEach((d) => {
      const lista = grupos.get(d.tipoDocumento.step) ?? [];
      lista.push(d);
      grupos.set(d.tipoDocumento.step, lista);
    });
    return Array.from(grupos.entries()).sort(([a], [b]) => a - b);
  }, [processo]);

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

  const progresso = progressoObrigatorios(processo.documentos);
  const liberado = processo.status === ProcessoStatus.LIBERADO_AGENDAMENTO;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-6">
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/averbacao')}
          className="mb-2 gap-1 px-0"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-mono text-lg font-semibold">
              {processo.protocolo}
            </h1>
            <p className="text-sm text-foreground">{processo.cliente.nome}</p>
          </div>
          <StatusProcesso status={processo.status} />
        </div>

        <dl className="mt-3 grid gap-x-6 gap-y-1 text-xs text-muted-foreground sm:grid-cols-3">
          <div>
            <dt className="inline">DI/DUIMP: </dt>
            <dd className="inline font-mono text-foreground">
              {processo.diDuimp}
            </dd>
          </div>
          <div>
            <dt className="inline">Modalidade: </dt>
            <dd className="inline text-foreground">
              {MODALIDADE_LABEL[processo.modalidade]}
            </dd>
          </div>
          <div>
            <dt className="inline">Container: </dt>
            <dd className="inline font-mono text-foreground">
              {processo.containerConhecimento}
            </dd>
          </div>
        </dl>

        <div className="mt-4 max-w-xs">
          <ProgressoObrigatorios {...progresso} />
        </div>
      </div>

      {liberado && (
        <div className="rounded-md border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900">
          Processo liberado para agendamento
          {processo.nLote ? ` — lote ${processo.nLote}` : ''}. Os documentos
          ficam somente para consulta.
        </div>
      )}

      {porEtapa.map(([step, documentos]) => (
        <section key={step} className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Etapa {step}
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {documentos.map((d) => (
              <CartaoDocumento
                key={d.id}
                documento={d}
                processoId={processo.id}
                somenteLeitura={liberado}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
