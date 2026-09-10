'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Plane,
  Plus,
  Search,
  Ship,
  Truck,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Column, DataTable, StatusCardConfig, StatusCards } from '@/components/ui/DataTable';
import { Input } from '@/components/ui/input';
import { useAverbacoes } from '@/hooks/useAverbacoes';
import {
  AverbacaoProcessoResumo,
  MODALIDADE_LABEL,
  Modalidade,
  ProcessoStatus,
  progressoObrigatorios,
} from '@/types/averbacao';
import { AverbacaoDetalheModal } from './AverbacaoDetalheModal';
import { NovaAverbacaoModal } from './NovaAverbacaoModal';
import { StatusProcesso } from './StatusBadges';

const CARDS: StatusCardConfig[] = [
  { status: 'total', label: 'Total', icon: CalendarDays, bgColor: 'bg-blue-50', textColor: 'text-blue-500' },
  { status: 'liberados', label: 'Liberados / Aptos', icon: CheckCircle2, bgColor: 'bg-emerald-50', textColor: 'text-emerald-500' },
  { status: 'analise', label: 'Em Análise', icon: Clock, bgColor: 'bg-amber-50', textColor: 'text-amber-500' },
  { status: 'pendencias', label: 'Pendências', icon: XCircle, bgColor: 'bg-red-50', textColor: 'text-red-500' },
];

const ICONE_MODALIDADE: Record<Modalidade, typeof Ship> = {
  [Modalidade.MARITIMO]: Ship,
  [Modalidade.AEREO]: Plane,
  [Modalidade.RODOVIARIO]: Truck,
};

/** Filtra pelos mesmos grupos dos cards de resumo. */
function filtrarPorCard(
  processos: AverbacaoProcessoResumo[],
  card: string,
): AverbacaoProcessoResumo[] {
  if (card === 'liberados')
    return processos.filter(
      (p) => p.status === ProcessoStatus.LIBERADO_AGENDAMENTO,
    );
  if (card === 'analise')
    return processos.filter((p) => p.status === ProcessoStatus.EM_ANALISE);
  if (card === 'pendencias')
    return processos.filter(
      (p) => p.status === ProcessoStatus.PENDENTE_CORRECAO,
    );
  return processos;
}

export function AverbacoesListPage({ podeCriar }: { podeCriar: boolean }) {
  const router = useRouter();
  const { data, isLoading, isError } = useAverbacoes();

  const [busca, setBusca] = useState('');
  const [modal, setModal] = useState<Modalidade | 'TODOS'>('TODOS');
  const [card, setCard] = useState('total');
  const [pagina, setPagina] = useState(1);
  const [detalheId, setDetalheId] = useState<string | null>(null);
  const [novoAberto, setNovoAberto] = useState(false);
  const limite = 15;

  const processos = useMemo(() => data ?? [], [data]);

  const contagem: Record<string, number> = {
    total: processos.length,
    liberados: processos.filter(
      (p) => p.status === ProcessoStatus.LIBERADO_AGENDAMENTO,
    ).length,
    analise: processos.filter((p) => p.status === ProcessoStatus.EM_ANALISE)
      .length,
    pendencias: processos.filter(
      (p) => p.status === ProcessoStatus.PENDENTE_CORRECAO,
    ).length,
  };

  const filtrados = useMemo(() => {
    let itens = filtrarPorCard(processos, card);

    if (modal !== 'TODOS') {
      itens = itens.filter((p) => p.modalidade === modal);
    }

    const termo = busca.trim().toLowerCase();
    if (termo) {
      itens = itens.filter((p) =>
        [
          p.diDuimp,
          p.containerConhecimento,
          p.protocolo,
          p.cliente.nome,
          p.cliente.cnpj ?? '',
        ]
          .join(' ')
          .toLowerCase()
          .includes(termo),
      );
    }

    return itens;
  }, [busca, card, modal, processos]);

  const colunas: Column<AverbacaoProcessoResumo>[] = [
    {
      key: 'di',
      header: 'DI',
      render: (p) => (
        <span className="font-mono text-sm font-semibold">{p.diDuimp}</span>
      ),
    },
    {
      key: 'container',
      header: 'Container / Conhecimento',
      render: (p) => {
        // O ícone carrega a modalidade, que por isso não precisa de coluna
        // própria — é o que o desenho pede e economiza uma coluna de texto.
        const Icon = ICONE_MODALIDADE[p.modalidade];
        return (
          <span
            className="flex items-center gap-2 font-mono text-sm"
            title={MODALIDADE_LABEL[p.modalidade]}
          >
            <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
            {p.containerConhecimento}
          </span>
        );
      },
    },
    {
      key: 'cliente',
      header: 'Cliente / Despachante',
      render: (p) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-primary">
            {p.cliente.nome}
          </p>
          {p.cliente.cnpj && (
            <p className="font-mono text-xs text-muted-foreground">
              CNPJ: {p.cliente.cnpj}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (p) => <StatusProcesso status={p.status} />,
    },
    {
      key: 'documentos',
      header: 'Documentos',
      align: 'center',
      render: (p) => {
        const { validados, total } = progressoObrigatorios(p.documentos);
        const pct = total === 0 ? 0 : Math.round((validados / total) * 100);
        return (
          <div className="mx-auto w-28">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={
                  pct === 100
                    ? 'h-full rounded-full bg-emerald-500'
                    : 'h-full rounded-full bg-primary'
                }
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="mt-1 block font-mono text-[11px] text-muted-foreground">
              {validados}/{total} obrigatórios
            </span>
          </div>
        );
      },
    },
    {
      key: 'acoes',
      header: 'Ações',
      align: 'right',
      render: (p) => (
        <Button
          size="sm"
          className="h-7 gap-1 text-xs"
          onClick={(e) => {
            // O clique da linha também abre; sem isto, os dois disparam.
            e.stopPropagation();
            setDetalheId(p.id);
          }}
        >
          <Plus className="h-3 w-3" />
          Detalhes
        </Button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Painel de acompanhamento de averbação
        </p>
        {podeCriar && (
          <Button onClick={() => setNovoAberto(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Averbação
          </Button>
        )}
      </div>

      <StatusCards
        cards={CARDS}
        statusCounts={contagem}
        activeStatus={card}
        onStatusClick={(s) => {
          setCard(s);
          setPagina(1);
        }}
      />

      <div className="rounded-xl border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold">Minhas DIs e Averbações</h2>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {filtrados.length} disponíveis
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full max-w-xs">
              <Search
                className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                value={busca}
                onChange={(e) => {
                  setBusca(e.target.value);
                  setPagina(1);
                }}
                placeholder="Buscar por DI, container, cliente..."
                className="pl-8"
                aria-label="Buscar por DI, container ou cliente"
              />
            </div>

            <select
              value={modal}
              onChange={(e) => {
                setModal(e.target.value as Modalidade | 'TODOS');
                setPagina(1);
              }}
              aria-label="Filtrar por modalidade"
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="TODOS">Modal: Todos</option>
              {Object.values(Modalidade).map((m) => (
                <option key={m} value={m}>
                  {MODALIDADE_LABEL[m]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <DataTable
          columns={colunas}
          data={filtrados.slice((pagina - 1) * limite, pagina * limite)}
          keyExtractor={(p) => p.id}
          isLoading={isLoading}
          isError={isError}
          emptyMessage={
            podeCriar
              ? 'Nenhum processo de averbação. Abra um para enviar os documentos exigidos pela modalidade.'
              : 'Os processos abertos pelo seu despachante aparecerão aqui.'
          }
          onRowClick={(p) => setDetalheId(p.id)}
          pagination={{
            page: pagina,
            total: filtrados.length,
            limit: limite,
            onPageChange: setPagina,
          }}
        />
      </div>

      <AverbacaoDetalheModal
        processoId={detalheId}
        onClose={() => setDetalheId(null)}
      />

      {podeCriar && (
        <NovaAverbacaoModal
          aberto={novoAberto}
          onClose={() => setNovoAberto(false)}
          // Ao concluir, abre o detalhe do que acabou de ser criado — é o que
          // a pessoa quer ver em seguida, e evita procurá-lo na lista.
          onCriado={setDetalheId}
        />
      )}
    </div>
  );
}
