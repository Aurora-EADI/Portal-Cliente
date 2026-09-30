'use client';

import { useMemo, useState } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Plane,
  Plus,
  Ship,
  Truck,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Column, DataTable, StatusCardConfig, StatusCards } from '@/components/ui/DataTable';
import { SearchBar } from '@/components/orion/blocks';
import { FiltroSelect } from '@/components/pages/shared/FiltroSelect';
import { useAverbacoes } from '@/hooks/useAverbacoes';
import { useAverbacoesStream } from '@/hooks/useAverbacoesStream';
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
  const { data, isLoading, isError } = useAverbacoes();
  // Liberação decidida no Aurora chega por SSE — a lista se atualiza sem F5.
  useAverbacoesStream();

  const [busca, setBusca] = useState('');
  const [modal, setModal] = useState<Modalidade | 'TODOS'>('TODOS');
  const [clienteId, setClienteId] = useState<string>('TODOS');
  const [card, setCard] = useState('total');
  const [pagina, setPagina] = useState(1);
  const [detalheId, setDetalheId] = useState<string | null>(null);
  const [novoAberto, setNovoAberto] = useState(false);
  const limite = 15;

  const todos = useMemo(() => data ?? [], [data]);

  // Clientes que aparecem nos processos do despachante, com quantos processos
  // cada um tem. Vem da própria lista: não oferece cliente sem processo, que
  // só levaria a uma tabela vazia.
  const clientes = useMemo(() => {
    const mapa = new Map<string, { id: string; nome: string; qtd: number }>();
    for (const p of todos) {
      const atual = mapa.get(p.cliente.id);
      if (atual) atual.qtd += 1;
      else mapa.set(p.cliente.id, { id: p.cliente.id, nome: p.cliente.nome, qtd: 1 });
    }
    return [...mapa.values()].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  }, [todos]);

  // Se o cliente escolhido sumir da lista (ex.: processo cancelado e filtrado
  // em outro lugar), volta para "Todos" em vez de mostrar tabela vazia.
  const clienteAtivo =
    clienteId !== 'TODOS' && clientes.some((c) => c.id === clienteId)
      ? clienteId
      : 'TODOS';

  // O filtro de cliente vem antes dos cards: eles passam a contar só os
  // processos daquele cliente, senão o número do card não bateria com a tabela.
  const processos = useMemo(
    () =>
      clienteAtivo === 'TODOS'
        ? todos
        : todos.filter((p) => p.cliente.id === clienteAtivo),
    [todos, clienteAtivo],
  );

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
          // Busca por qualquer um dos containers, não só pelo primeiro: quem
          // procura tem em mãos o número que recebeu, que pode ser o 12º.
          (p.containers ?? [p.containerConhecimento]).join(' '),
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
        const lista = p.containers?.length
          ? p.containers
          : [p.containerConhecimento];
        const restantes = lista.length - 1;
        return (
          <span
            className="flex items-center gap-2 font-mono text-sm"
            // A lista inteira no title: a coluna não comporta 16 containers,
            // mas quem passa o mouse precisa conseguir conferir.
            title={`${MODALIDADE_LABEL[p.modalidade]} · ${lista.join(', ')}`}
          >
            <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
            {lista[0]}
            {restantes > 0 && (
              <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                +{restantes}
              </span>
            )}
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
        {/* Título em cima, filtros na linha de baixo: lado a lado, com o
            seletor de cliente, a linha estourava e quebrava de forma irregular. */}
        <div className="flex flex-col gap-3 border-b px-5 py-4">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold">Minhas DIs e Averbações</h2>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {filtrados.length} disponíveis
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Só faz sentido com mais de um cliente — o login de CLIENTE vê
                apenas os próprios processos. */}
            {clientes.length > 1 && (
              <FiltroSelect
                value={clienteAtivo}
                onChange={(v) => {
                  setClienteId(v);
                  setPagina(1);
                }}
                ariaLabel="Filtrar por cliente"
                className="w-64"
                opcoes={[
                  { value: 'TODOS', label: `Cliente: Todos (${todos.length})` },
                  ...clientes.map((c) => ({
                    value: c.id,
                    label: `${c.nome} (${c.qtd})`,
                  })),
                ]}
              />
            )}

            <SearchBar
              value={busca}
              onChange={(v) => {
                setBusca(v);
                setPagina(1);
              }}
              placeholder="Buscar por DI, container, cliente..."
              className="w-full max-w-xs"
            />

            <FiltroSelect
              value={modal}
              onChange={(v) => {
                setModal(v as Modalidade | 'TODOS');
                setPagina(1);
              }}
              ariaLabel="Filtrar por modalidade"
              className="w-44"
              opcoes={[
                { value: 'TODOS', label: 'Modal: Todos' },
                ...Object.values(Modalidade).map((m) => ({
                  value: m,
                  label: MODALIDADE_LABEL[m],
                })),
              ]}
            />
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
