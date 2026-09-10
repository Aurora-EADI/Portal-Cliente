'use client';

import { useMemo, useState } from 'react';
import {
  AlertCircle,
  Ban,
  CalendarDays,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileUp,
  RefreshCw,
  Search,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { procuracoesService } from '@/services/procuracoes.service';
import { useRepresentados } from '@/hooks/useProcuracoes';
import {
  ClienteRepresentado,
  SITUACAO_LABEL,
  SituacaoRepresentado,
  situacaoDe,
} from '@/types/procuracao';
import { AnexarProcuracaoModal } from './AnexarProcuracaoModal';

const BADGE: Record<
  SituacaoRepresentado,
  { variant: 'success' | 'warning' | 'danger' | 'secondary'; Icon: typeof Clock }
> = {
  VIGENTE: { variant: 'success', Icon: CheckCircle2 },
  EM_ANALISE: { variant: 'warning', Icon: Clock },
  REPROVADA: { variant: 'danger', Icon: AlertCircle },
  REVOGADA: { variant: 'danger', Icon: Ban },
  VENCIDA: { variant: 'danger', Icon: CalendarDays },
  SEM_PROCURACAO: { variant: 'secondary', Icon: FileUp },
};

/** UTC porque a validade é uma data pura; converter por fuso mudaria o dia. */
function formatarData(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

/** Faltando 30 dias ou menos, a validade vira aviso em vez de dado neutro. */
function diasAteVencer(iso: string | null): number | null {
  if (!iso) return null;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  return Math.round((new Date(iso).getTime() - hoje.getTime()) / 86400000);
}

function Resumo({ itens }: { itens: ClienteRepresentado[] }) {
  const contagem = useMemo(() => {
    const por = (s: SituacaoRepresentado) =>
      itens.filter((i) => situacaoDe(i) === s).length;
    return {
      clientes: itens.length,
      aprovadas: por('VIGENTE'),
      emAnalise: por('EM_ANALISE'),
      pendentes:
        por('SEM_PROCURACAO') +
        por('REPROVADA') +
        por('REVOGADA') +
        por('VENCIDA'),
    };
  }, [itens]);

  const cards = [
    { label: 'Clientes', valor: contagem.clientes, Icon: Users, cor: 'text-sky-600 bg-sky-50' },
    { label: 'Aprovadas', valor: contagem.aprovadas, Icon: CheckCircle2, cor: 'text-emerald-600 bg-emerald-50' },
    { label: 'Em análise', valor: contagem.emAnalise, Icon: Clock, cor: 'text-amber-600 bg-amber-50' },
    { label: 'Pendentes / Reprovadas', valor: contagem.pendentes, Icon: AlertCircle, cor: 'text-red-600 bg-red-50' },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(({ label, valor, Icon, cor }) => (
        <Card key={label}>
          <CardContent className="flex items-center justify-between gap-3 pt-6">
            <div>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{valor}</p>
            </div>
            <span className={cn('flex h-9 w-9 items-center justify-center rounded-full', cor)}>
              <Icon className="h-4 w-4" aria-hidden />
            </span>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function LinhaRepresentado({
  item,
  onAnexar,
}: {
  item: ClienteRepresentado;
  onAnexar: (clienteId: string) => void;
}) {
  const situacao = situacaoDe(item);
  const { variant, Icon } = BADGE[situacao];
  const validade = formatarData(item.procuracao?.validade ?? null);
  const dias = diasAteVencer(item.procuracao?.validade ?? null);
  const vencendo = situacao === 'VIGENTE' && dias !== null && dias <= 30;

  return (
    <div className="flex flex-wrap items-start justify-between gap-4 border-b px-5 py-4 last:border-b-0">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={variant} className="gap-1">
            <Icon className="h-3 w-3" />
            {SITUACAO_LABEL[situacao]}
          </Badge>

          {item.procuracao?.arquivoNome && (
            <a
              href={procuracoesService.urlArquivo(item.procuracao.id)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex max-w-[240px] items-center gap-1 rounded border px-2 py-0.5 font-mono text-xs text-primary hover:bg-muted"
            >
              <ExternalLink className="h-3 w-3 shrink-0" />
              <span className="truncate">{item.procuracao.arquivoNome}</span>
            </a>
          )}

          {validade && (
            <span
              className={cn(
                'inline-flex items-center gap-1 text-xs',
                situacao === 'VENCIDA'
                  ? 'font-medium text-destructive'
                  : vencendo
                    ? 'font-medium text-amber-700'
                    : 'text-muted-foreground',
              )}
            >
              <CalendarDays className="h-3 w-3" />
              {situacao === 'VENCIDA' ? 'Venceu em' : 'Validade:'} {validade}
              {vencendo && dias !== null && ` · faltam ${dias}d`}
            </span>
          )}
        </div>

        <p className="mt-1.5 font-semibold text-foreground">{item.cliente.nome}</p>
        <p className="text-xs text-muted-foreground">
          {item.cliente.cnpj && <span className="font-mono">CNPJ: {item.cliente.cnpj}</span>}
          {item.processos > 0 && (
            <>
              {item.cliente.cnpj && ' • '}
              {item.processos} processo{item.processos !== 1 ? 's' : ''} de averbação
            </>
          )}
        </p>

        {(situacao === 'REPROVADA' || situacao === 'REVOGADA') &&
          item.procuracao?.motivoRecusa && (
            <div className="mt-2 rounded-md border border-destructive/40 bg-destructive/5 p-2.5">
              <p className="text-xs font-medium text-destructive">
                {situacao === 'REVOGADA'
                  ? 'Motivo da revogação'
                  : 'Motivo da recusa'}
              </p>
              <p className="mt-0.5 text-sm">{item.procuracao.motivoRecusa}</p>
            </div>
          )}
      </div>

      <div className="shrink-0">
        {situacao === 'EM_ANALISE' ? (
          <span className="text-xs text-muted-foreground">Aguardando a Aurora</span>
        ) : (
          <Button
            size="sm"
            variant={situacao === 'VIGENTE' ? 'outline' : 'default'}
            className="gap-1.5"
            onClick={() => onAnexar(item.cliente.id)}
          >
            {situacao === 'VIGENTE' ? (
              <>
                <RefreshCw className="h-3.5 w-3.5" />
                Substituir
              </>
            ) : (
              <>
                <FileUp className="h-3.5 w-3.5" />
                Anexar Procuração
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

export function ProcuracoesPage() {
  const { data, isLoading } = useRepresentados();
  const [busca, setBusca] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [clienteAlvo, setClienteAlvo] = useState<string | null>(null);

  const itens = useMemo(() => data ?? [], [data]);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return itens;
    return itens.filter(
      (i) =>
        i.cliente.nome.toLowerCase().includes(termo) ||
        (i.cliente.cnpj ?? '').toLowerCase().includes(termo),
    );
  }, [busca, itens]);

  const liberados = itens.filter((i) => i.vigente).length;

  const abrirModal = (clienteId?: string) => {
    setClienteAlvo(clienteId ?? null);
    setModalAberto(true);
  };

  return (
    <div className="space-y-5 p-6">
      <Card>
        <CardContent className="flex flex-wrap items-start justify-between gap-4 pt-6">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="warning">Representação por Cliente</Badge>
              {itens.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {liberados} de {itens.length} clientes liberados
                </span>
              )}
            </div>
            <h1 className="mt-1.5 text-lg font-semibold">
              Procurações dos Clientes Representados
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Anexe a procuração de cada cliente que você representa. As operações
              em nome de um cliente só são liberadas após a aprovação da equipe Aurora.
            </p>
          </div>
          <Button className="shrink-0 gap-1.5" onClick={() => abrirModal()}>
            <FileUp className="h-4 w-4" />
            Anexar Procuração
          </Button>
        </CardContent>
      </Card>

      {itens.length > 0 && <Resumo itens={itens} />}

      <Card>
        <CardContent className="p-0">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
            <h2 className="font-semibold">Clientes Representados</h2>
            <div className="relative w-full max-w-xs">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar cliente ou CNPJ..."
                className="pl-8"
                aria-label="Buscar cliente ou CNPJ"
              />
            </div>
          </div>

          {isLoading ? (
            <p className="px-5 py-10 text-sm text-muted-foreground">Carregando…</p>
          ) : filtrados.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="text-sm font-medium">
                {itens.length === 0
                  ? 'Nenhum cliente representado ainda'
                  : 'Nenhum cliente encontrado'}
              </p>
              <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                {itens.length === 0
                  ? 'A lista vem dos clientes que já aparecem nas suas DIs. Se o importador é novo, aguarde a primeira DI ser registrada.'
                  : 'Ajuste a busca.'}
              </p>
            </div>
          ) : (
            <div>
              {filtrados.map((item) => (
                <LinhaRepresentado
                  key={item.cliente.id}
                  item={item}
                  onAnexar={abrirModal}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AnexarProcuracaoModal
        aberto={modalAberto}
        onClose={() => {
          setModalAberto(false);
          setClienteAlvo(null);
        }}
        representados={itens}
        clienteInicial={clienteAlvo}
      />
    </div>
  );
}
