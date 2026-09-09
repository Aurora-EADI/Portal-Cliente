'use client';

import { useMemo, useState } from 'react';
import {
  ExternalLink,
  History,
  Loader2,
  Plane,
  Ship,
  Truck,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import { FileUpload } from '@/components/ui/FileUpload';
import { cn } from '@/lib/utils';
import { averbacoesService } from '@/services/averbacoes.service';
import { useEnviarDocumento } from '@/hooks/useAverbacoes';
import {
  AverbacaoDocumento,
  AverbacaoProcessoDetalhe,
  DocumentoStatus,
  HISTORICO_ACAO_LABEL,
  MODALIDADE_LABEL,
  Modalidade,
  ProcessoStatus,
  progressoObrigatorios,
} from '@/types/averbacao';
import { StatusDocumento, StatusProcesso } from './StatusBadges';

const ICONE_MODALIDADE: Record<Modalidade, typeof Ship> = {
  [Modalidade.MARITIMO]: Ship,
  [Modalidade.AEREO]: Plane,
  [Modalidade.RODOVIARIO]: Truck,
};

function formatarDataHora(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

/** Cabeçalho: identifica o processo antes de qualquer ação sobre ele. */
export function CabecalhoProcesso({
  processo,
}: {
  processo: AverbacaoProcessoDetalhe;
}) {
  const Icon = ICONE_MODALIDADE[processo.modalidade];

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded border px-2 py-0.5 font-mono text-xs font-medium">
          {processo.protocolo}
        </span>
        <span className="inline-flex items-center gap-1 rounded border px-2 py-0.5 text-xs font-medium uppercase text-muted-foreground">
          <Icon className="h-3 w-3" aria-hidden />
          {MODALIDADE_LABEL[processo.modalidade]}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-mono text-xl font-bold">DI: {processo.diDuimp}</h2>
        <StatusProcesso status={processo.status} />
      </div>

      <p className="text-sm text-muted-foreground">
        <span className="font-medium text-foreground">
          {processo.cliente.nome}
        </span>
        {processo.cliente.cnpj && <> · CNPJ: {processo.cliente.cnpj}</>}
        {' · Conhecimento: '}
        <span className="font-mono">{processo.containerConhecimento}</span>
        {processo.cargaEspecial && (
          <> · <span className="text-amber-700">Carga especial</span></>
        )}
      </p>
    </div>
  );
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
  const [anexando, setAnexando] = useState(false);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [erro, setErro] = useState<string | null>(null);
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
      setAnexando(false);
      toast.success(`${documento.tipoDocumento.descricao} enviado para análise.`);
    } catch (e: any) {
      const m = e?.response?.data?.message;
      setErro(Array.isArray(m) ? m.join(', ') : m || 'Falha ao enviar.');
    }
  };

  return (
    <div className="rounded-lg border p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="min-w-0 font-medium">{documento.tipoDocumento.descricao}</p>
        {documento.tipoDocumento.obrigatorio ? (
          <Badge variant="danger">Obrigatório</Badge>
        ) : (
          <Badge variant="secondary">Opcional</Badge>
        )}
      </div>

      <div
        className={cn(
          'mt-3 rounded-md border px-3 py-3 text-center text-sm',
          documento.arquivoNome
            ? 'bg-muted/30'
            : 'border-dashed text-muted-foreground',
        )}
      >
        {documento.arquivoNome ? (
          <a
            href={averbacoesService.urlArquivo(documento.id)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex max-w-full items-center gap-1.5 text-primary hover:underline"
          >
            <ExternalLink className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{documento.arquivoNome}</span>
          </a>
        ) : (
          'Nenhum arquivo enviado para esta exigência.'
        )}
      </div>

      {documento.status === DocumentoStatus.REJEITADO &&
        documento.motivoRejeicao && (
          <div className="mt-2 rounded-md border border-destructive/40 bg-destructive/5 p-2.5">
            <p className="text-xs font-medium text-destructive">
              Motivo da rejeição
            </p>
            <p className="mt-0.5 text-sm">{documento.motivoRejeicao}</p>
          </div>
        )}

      {anexando && podeEnviar && (
        <div className="mt-3 space-y-2">
          <FileUpload
            value={arquivo}
            onChange={(f) => {
              setArquivo(f);
              setErro(null);
            }}
            accept={['application/pdf']}
            label="Arraste o PDF ou clique para escolher"
            hint="PDF até 20 MB"
            error={erro}
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={submeter}
              disabled={!arquivo || isPending}
              className="flex-1"
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar para análise
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setAnexando(false);
                setArquivo(null);
                setErro(null);
              }}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        {podeEnviar && !anexando ? (
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() => setAnexando(true)}
          >
            <Upload className="h-3.5 w-3.5" />
            {documento.arquivoNome ? 'Substituir documento' : 'Anexar Documento'}
          </Button>
        ) : (
          <span />
        )}
        <StatusDocumento status={documento.status} />
      </div>
    </div>
  );
}

/** Trilha consolidada: o que aconteceu no processo, e não em um documento só. */
function TrilhaAuditoria({ processo }: { processo: AverbacaoProcessoDetalhe }) {
  const entradas = useMemo(
    () =>
      processo.documentos
        .flatMap((d) =>
          (d.historico ?? []).map((h) => ({
            ...h,
            documento: d.tipoDocumento.descricao,
          })),
        )
        .sort(
          (a, b) =>
            new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime(),
        ),
    [processo],
  );

  if (entradas.length === 0) {
    return (
      <p className="px-1 py-8 text-center text-sm text-muted-foreground">
        Nenhuma movimentação registrada ainda.
      </p>
    );
  }

  return (
    <ol className="space-y-4 border-l pl-4">
      {entradas.map((h) => (
        <li key={h.id} className="relative">
          <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-border" />
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-sm font-medium">
              {HISTORICO_ACAO_LABEL[h.acao]}
            </span>
            <span className="text-sm text-muted-foreground">{h.documento}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {h.autorNome} · {formatarDataHora(h.criadoEm)}
          </p>
          {h.arquivoNome && (
            <p className="font-mono text-[11px] text-muted-foreground">
              {h.arquivoNome}
            </p>
          )}
          {h.motivo && <p className="mt-0.5 text-sm">{h.motivo}</p>}
        </li>
      ))}
    </ol>
  );
}

/**
 * Miolo do detalhe, compartilhado pelo modal da lista e pela rota
 * /averbacao/[id] — que continua existindo como link direto para um processo.
 */
export function AverbacaoDetalheConteudo({
  processo,
}: {
  processo: AverbacaoProcessoDetalhe;
}) {
  const [aba, setAba] = useState<'DOCUMENTOS' | 'TRILHA'>('DOCUMENTOS');

  // `step` não é etapa de nada na tela: virou só o critério de ordem, com
  // `ordem` desempatando dentro do mesmo valor.
  const documentos = useMemo(
    () =>
      processo.documentos
        .slice()
        .sort(
          (a, b) =>
            a.tipoDocumento.step - b.tipoDocumento.step ||
            a.tipoDocumento.ordem - b.tipoDocumento.ordem,
        ),
    [processo],
  );

  const progresso = progressoObrigatorios(processo.documentos);
  const liberado = processo.status === ProcessoStatus.LIBERADO_AGENDAMENTO;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-1 border-b">
        {(
          [
            ['DOCUMENTOS', `Documentos (${documentos.length})`],
            ['TRILHA', 'Trilha de Auditoria'],
          ] as const
        ).map(([id, rotulo]) => (
          <button
            key={id}
            type="button"
            onClick={() => setAba(id)}
            className={cn(
              '-mb-px border-b-2 px-4 py-2 text-sm transition-colors',
              aba === id
                ? 'border-primary font-medium text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {id === 'TRILHA' && <History className="mr-1.5 inline h-3.5 w-3.5" />}
            {rotulo}
          </button>
        ))}
      </div>

      {liberado && (
        <div className="rounded-md border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900">
          Processo liberado para agendamento
          {processo.nLote ? ` — lote ${processo.nLote}` : ''}. Os documentos
          ficam somente para consulta.
        </div>
      )}

      {aba === 'DOCUMENTOS' ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/30 px-4 py-3">
            <p className="text-sm text-muted-foreground">
              O agendamento só abre quando todos os obrigatórios estiverem
              validados pela equipe da Aurora.
            </p>
            <span className="rounded-md border bg-background px-3 py-1.5 font-mono text-xs">
              {progresso.validados} / {progresso.total} obrigatórios validados
            </span>
          </div>

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
        </>
      ) : (
        <TrilhaAuditoria processo={processo} />
      )}
    </div>
  );
}
