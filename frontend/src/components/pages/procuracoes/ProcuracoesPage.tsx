'use client';

import { useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileSignature,
  Plus,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { FileUpload } from '@/components/ui/FileUpload';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { procuracoesService } from '@/services/procuracoes.service';
import {
  useClientesDisponiveis,
  useEnviarProcuracao,
  useProcuracoes,
} from '@/hooks/useProcuracoes';
import {
  PROCURACAO_STATUS_LABEL,
  Procuracao,
  ProcuracaoStatus,
} from '@/types/procuracao';

const BADGE: Record<
  ProcuracaoStatus,
  { variant: 'success' | 'warning' | 'danger' | 'secondary'; Icon: typeof Clock }
> = {
  [ProcuracaoStatus.APROVADA]: { variant: 'success', Icon: CheckCircle2 },
  [ProcuracaoStatus.EM_ANALISE]: { variant: 'warning', Icon: Clock },
  [ProcuracaoStatus.REPROVADA]: { variant: 'danger', Icon: AlertCircle },
  [ProcuracaoStatus.PENDENTE_ENVIO]: { variant: 'secondary', Icon: Clock },
};

function formatarData(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

function CartaoProcuracao({
  procuracao,
  onReenviar,
}: {
  procuracao: Procuracao;
  onReenviar: (p: Procuracao) => void;
}) {
  const { variant, Icon } = BADGE[procuracao.status];
  const podeReenviar =
    procuracao.status === ProcuracaoStatus.REPROVADA ||
    procuracao.status === ProcuracaoStatus.PENDENTE_ENVIO;

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">
              {procuracao.cliente.nome}
            </p>
            {procuracao.cliente.cnpj && (
              <p className="font-mono text-xs text-muted-foreground">
                {procuracao.cliente.cnpj}
              </p>
            )}
          </div>
          <Badge variant={variant} className="shrink-0 gap-1">
            <Icon className="h-3 w-3" />
            {PROCURACAO_STATUS_LABEL[procuracao.status]}
          </Badge>
        </div>

        {procuracao.status === ProcuracaoStatus.REPROVADA &&
          procuracao.motivoRecusa && (
            <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3">
              <p className="text-xs font-medium text-destructive">
                Motivo da recusa
              </p>
              <p className="mt-1 text-sm text-foreground">
                {procuracao.motivoRecusa}
              </p>
            </div>
          )}

        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <div>
            <dt className="inline">Enviada em </dt>
            <dd className="inline text-foreground">
              {formatarData(procuracao.enviadoEm)}
            </dd>
          </div>
          {procuracao.analisadoEm && (
            <div>
              <dt className="inline">Analisada em </dt>
              <dd className="inline text-foreground">
                {formatarData(procuracao.analisadoEm)}
              </dd>
            </div>
          )}
        </dl>

        <div className="flex flex-wrap items-center gap-2 border-t pt-3">
          {procuracao.arquivoNome && (
            <a
              href={procuracoesService.urlArquivo(procuracao.id)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              {procuracao.arquivoNome}
            </a>
          )}
          <div className="flex-1" />
          {podeReenviar && (
            <Button size="sm" onClick={() => onReenviar(procuracao)}>
              Reenviar documento
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function ProcuracoesPage() {
  const { data: procuracoes, isLoading } = useProcuracoes();
  const { data: disponiveis } = useClientesDisponiveis();
  const { mutateAsync: enviar, isPending: enviando } = useEnviarProcuracao();

  const [formAberto, setFormAberto] = useState(false);
  const [clienteId, setClienteId] = useState<string>('');
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  // No reenvio o cliente já está definido e não deve ser trocado — trocar
  // criaria uma procuração para outro cliente sem a pessoa perceber.
  const [reenviando, setReenviando] = useState<Procuracao | null>(null);

  const opcoes = useMemo(() => disponiveis ?? [], [disponiveis]);

  const abrirNova = () => {
    setReenviando(null);
    setClienteId('');
    setArquivo(null);
    setErro(null);
    setFormAberto(true);
  };

  const abrirReenvio = (p: Procuracao) => {
    setReenviando(p);
    setClienteId(p.cliente.id);
    setArquivo(null);
    setErro(null);
    setFormAberto(true);
  };

  const fechar = () => {
    setFormAberto(false);
    setReenviando(null);
    setClienteId('');
    setArquivo(null);
    setErro(null);
  };

  const submeter = async () => {
    if (!clienteId || !arquivo) return;
    setErro(null);
    try {
      await enviar({ clienteId, arquivo });
      toast.success('Procuração enviada para análise da equipe Aurora.');
      fechar();
    } catch (e: any) {
      const mensagem =
        e?.response?.data?.message || 'Falha ao enviar a procuração.';
      setErro(Array.isArray(mensagem) ? mensagem.join(', ') : mensagem);
    }
  };

  const semCandidatos = !reenviando && opcoes.length === 0;

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Procurações</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Autorização do importador para você operar em nome dele. A aprovação
            é por cliente: liberar um não libera os demais.
          </p>
        </div>
        <Button onClick={formAberto ? fechar : abrirNova} className="gap-2">
          {formAberto ? (
            <X className="h-4 w-4" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          {formAberto ? 'Cancelar' : 'Nova procuração'}
        </Button>
      </div>

      {formAberto && (
        <Card className="border-primary/40">
          <CardHeader>
            <CardTitle className="text-base">
              {reenviando
                ? `Reenviar procuração — ${reenviando.cliente.nome}`
                : 'Nova procuração'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!reenviando && (
              <div>
                <Label htmlFor="cliente">Importador</Label>
                {semCandidatos ? (
                  <p className="mt-1 rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
                    Nenhum importador disponível. A lista vem dos clientes que
                    já aparecem nas suas DIs — se o importador é novo, aguarde a
                    primeira DI ser registrada.
                  </p>
                ) : (
                  <Select value={clienteId} onValueChange={setClienteId}>
                    <SelectTrigger id="cliente">
                      <SelectValue placeholder="Selecione o importador" />
                    </SelectTrigger>
                    <SelectContent>
                      {opcoes.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.nome}
                          {c.cnpj ? ` — ${c.cnpj}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            <FileUpload
              value={arquivo}
              onChange={(f) => {
                setArquivo(f);
                setErro(null);
              }}
              accept={['application/pdf']}
              label="Anexar procuração"
              hint="Arraste o PDF assinado ou clique para escolher"
              error={erro}
            />

            <div className="flex justify-end gap-2 border-t pt-4">
              <Button variant="outline" onClick={fechar}>
                Cancelar
              </Button>
              <Button
                onClick={submeter}
                disabled={!clienteId || !arquivo || enviando}
              >
                {enviando ? 'Enviando…' : 'Enviar para análise'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : procuracoes && procuracoes.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {procuracoes.map((p) => (
            <CartaoProcuracao
              key={p.id}
              procuracao={p}
              onReenviar={abrirReenvio}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-10 text-center">
          <FileSignature className="h-8 w-8 text-muted-foreground" aria-hidden />
          <p className="text-sm font-medium text-foreground">
            Nenhuma procuração ainda
          </p>
          <p className="max-w-md text-sm text-muted-foreground">
            Sem procuração aprovada você consegue ver as DIs do importador, mas
            não abrir processo, anexar documento nem agendar em nome dele.
          </p>
        </div>
      )}
    </div>
  );
}
