'use client';

import { useMemo, useState, useEffect } from 'react';
import {
  Eye,
  Edit,
  Plus,
  Ship,
  Trash2,
  Anchor,
  Building2,
  Folder,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Clock,
} from 'lucide-react';
import {
  DataTable,
  Column,
  SearchBar,
  StatusCards,
  StatusCardConfig,
  PageHeader,
} from '@/components/ui/DataTable';
import { ActionButton } from '@/components/ui/ActionButton';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useProcessos, useDeleteProcesso } from '@/hooks/useDtaMaritime';
import { ProcessoImportacao } from '@/types/dtaMaritime';
import { formatDateBR, parseLocaleDate } from '@/lib/date-format-utils';
import { ProcessoFormModal } from './modals/ProcessoFormModal';
import { DtaProcessoDetail } from './DtaProcessoDetail';

// Status derivado do campo conclusao
const getProcessoStatus = (p: ProcessoImportacao) =>
  p.conclusao ? 'CONCLUDED' : 'ACTIVE';

const STATUS_CARDS: StatusCardConfig[] = [
  {
    status: 'ACTIVE',
    label: 'Em Andamento',
    icon: Clock,
    bgColor: 'bg-amber-100',
    textColor: 'text-amber-600',
  },
  {
    status: 'CONCLUDED',
    label: 'Concluídos',
    icon: CheckCircle,
    bgColor: 'bg-emerald-100',
    textColor: 'text-emerald-600',
  },
];

const getMonthName = (monthIndex: number) => {
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ];
  return months[monthIndex];
};

function formatCurrency(value?: number | null): string {
  if (value == null) return '—';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);
}

export function DtaMaritimoDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ACTIVE');
  const [selectedProcessoId, setSelectedProcessoId] = useState<string | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingProcesso, setEditingProcesso] = useState<ProcessoImportacao | null>(null);
  const [processoToDelete, setProcessoToDelete] = useState<ProcessoImportacao | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [filterYear, setFilterYear] = useState<string>('all');

  const { data: processos = [], isLoading, isError } = useProcessos();
  const deleteMutation = useDeleteProcesso();

  // Filtrar processos pelo período selecionado (usando ataDta como referência)
  const processosInPeriod = useMemo(() => {
    return processos.filter((p) => {
      const d = parseLocaleDate(p.ataDta);
      if (!d) return true; // sem data: inclui sempre

      const matchesYear =
        filterYear === 'all' || d.getFullYear().toString() === filterYear;
      const matchesMonth =
        filterMonth === 'all' || (d.getMonth() + 1).toString() === filterMonth;

      return matchesYear && matchesMonth;
    });
  }, [processos, filterMonth, filterYear]);

  // Agrupar por mês/ano usando ataDta
  const groupedFolders = useMemo(() => {
    const groups: Record<string, { year: number; month: number; processos: ProcessoImportacao[] }> = {};

    const filtered = statusFilter
      ? processosInPeriod.filter((p) => getProcessoStatus(p) === statusFilter)
      : processosInPeriod;

    filtered.forEach((processo) => {
      const date = parseLocaleDate(processo.ataDta);
      if (!date) return;

      const year = date.getFullYear();
      const month = date.getMonth();
      const key = `${year}-${month.toString().padStart(2, '0')}`;

      if (!groups[key]) {
        groups[key] = { year, month, processos: [] };
      }
      groups[key].processos.push(processo);
    });

    return Object.entries(groups)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([key, value]) => ({ key, ...value }));
  }, [processosInPeriod, statusFilter]);

  // Auto-voltar para pastas se a pasta atual ficar vazia
  useEffect(() => {
    if (selectedFolder) {
      const folderExists = groupedFolders.some((f) => f.key === selectedFolder);
      if (!folderExists) {
        setSelectedFolder(null);
        setPage(1);
      }
    }
  }, [selectedFolder, groupedFolders]);

  const statusCounts = useMemo(() => ({
    ACTIVE: processosInPeriod.filter((p) => getProcessoStatus(p) === 'ACTIVE').length,
    CONCLUDED: processosInPeriod.filter((p) => getProcessoStatus(p) === 'CONCLUDED').length,
  }), [processosInPeriod]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setPage(1);
    if (value) {
      setStatusFilter('');
      setSelectedFolder(null);
    } else {
      setStatusFilter('ACTIVE');
    }
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setStatusFilter('ACTIVE');
    setSelectedFolder(null);
    setPage(1);
  };

  const handleStatusCardClick = (status: string) => {
    setStatusFilter(status);
    setSearchTerm('');
    setSelectedFolder(null);
    setPage(1);
  };

  const handleOpenCreate = () => {
    setEditingProcesso(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (processo: ProcessoImportacao) => {
    setEditingProcesso(processo);
    setIsFormModalOpen(true);
  };

  // Dados paginados para busca (flat list)
  const filteredForSearch = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const term = searchTerm.toLowerCase();
    return processos.filter(
      (p) =>
        p.dta.toLowerCase().includes(term) ||
        p.empresa.toLowerCase().includes(term) ||
        p.porto?.toLowerCase().includes(term) ||
        p.navio?.toLowerCase().includes(term),
    );
  }, [processos, searchTerm]);

  const paginatedSearch = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredForSearch.slice(start, start + limit);
  }, [filteredForSearch, page, limit]);

  // Dados dentro de uma pasta selecionada
  const processoDataInFolder = useMemo(() => {
    if (!selectedFolder) return [];
    const folder = groupedFolders.find((f) => f.key === selectedFolder);
    return folder ? folder.processos : [];
  }, [groupedFolders, selectedFolder]);

  const paginatedFolder = useMemo(() => {
    const start = (page - 1) * limit;
    return processoDataInFolder.slice(start, start + limit);
  }, [processoDataInFolder, page, limit]);

  const columns: Column<ProcessoImportacao>[] = [
    {
      key: 'dta',
      header: 'DTA',
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-slate-100 text-slate-600">
            <Ship size={18} />
          </div>
          <span className="font-semibold text-slate-900 font-mono">{item.dta}</span>
        </div>
      ),
    },
    {
      key: 'empresa',
      header: 'Empresa',
      render: (item) => <span className="text-slate-700">{item.empresa}</span>,
    },
    {
      key: 'porto',
      header: 'Porto',
      render: (item) => {
        if (!item.porto) return <span className="text-slate-400">—</span>;
        const icon =
          item.porto === 'Chibatão' ? (
            <Anchor className="w-3.5 h-3.5" />
          ) : item.porto === 'Super Terminais' ? (
            <Building2 className="w-3.5 h-3.5" />
          ) : null;
        return (
          <div className="flex items-center gap-1.5 text-slate-700">
            {icon}
            <span className="text-sm">{item.porto}</span>
          </div>
        );
      },
    },
    {
      key: 'navio',
      header: 'Navio',
      render: (item) => <span className="text-slate-600">{item.navio || '—'}</span>,
    },
    {
      key: 'ataDta',
      header: 'ATA DTA',
      render: (item) => <span className="text-slate-600">{formatDateBR(item.ataDta)}</span>,
    },
    {
      key: 'conclusao',
      header: 'Conclusão',
      render: (item) => <span className="text-slate-600">{formatDateBR(item.conclusao)}</span>,
    },
    {
      key: 'cifTotal',
      header: 'CIF Total',
      align: 'right',
      render: (item) => (
        <span className="font-semibold text-slate-800">{formatCurrency(item.cifTotal)}</span>
      ),
    },
    {
      key: 'containers',
      header: 'Containers',
      align: 'center',
      render: (item) => (
        <Badge variant="secondary" className="font-mono">
          {item._count?.containers ?? item.containers?.length ?? 0}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => {
        const isConcluded = getProcessoStatus(item) === 'CONCLUDED';
        return (
          <Badge
            variant="outline"
            className={
              isConcluded
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }
          >
            {isConcluded ? 'CONCLUÍDO' : 'EM ANDAMENTO'}
          </Badge>
        );
      },
    },
    {
      key: 'actions',
      header: 'Ações',
      align: 'center',
      render: (item) => (
        <div className="flex justify-center gap-2" onClick={(e) => e.stopPropagation()}>
          <ActionButton
            onClick={() => setSelectedProcessoId(item.id)}
            icon={<Eye size={16} />}
          >
            Detalhes
          </ActionButton>
          <ActionButton
            onClick={() => handleOpenEdit(item)}
            icon={<Edit size={16} />}
            title="Editar"
          />
          <ActionButton
            onClick={() => setProcessoToDelete(item)}
            icon={<Trash2 size={16} />}
            className="text-red-500 hover:text-red-700 hover:bg-red-50 border-red-200"
            title="Excluir"
          />
        </div>
      ),
    },
  ];

  if (selectedProcessoId) {
    return (
      <DtaProcessoDetail
        processoId={selectedProcessoId}
        onBack={() => setSelectedProcessoId(null)}
        onEdit={(processo) => {
          setSelectedProcessoId(null);
          handleOpenEdit(processo);
        }}
      />
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title="Processos de Importação Marítima"
        description="Gerencie os processos DTA e seus containers."
        actions={
          <Button onClick={handleOpenCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Processo
          </Button>
        }
      />

      <StatusCards
        cards={STATUS_CARDS}
        statusCounts={statusCounts}
        activeStatus={statusFilter}
        onStatusClick={handleStatusCardClick}
        columns={2}
      />

      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-end md:items-center">
          <div className="flex-1 w-full">
            <SearchBar
              placeholder="Buscar por DTA, empresa, porto ou navio..."
              onSearch={handleSearch}
              onClear={handleClearSearch}
              showClearButton={!!(searchTerm || statusFilter)}
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <Select value={filterMonth} onValueChange={setFilterMonth}>
              <SelectTrigger className="w-[140px] bg-white border-slate-200">
                <SelectValue placeholder="Mês" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Meses</SelectItem>
                {Array.from({ length: 12 }).map((_, i) => (
                  <SelectItem key={i + 1} value={(i + 1).toString()}>
                    {getMonthName(i)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterYear} onValueChange={setFilterYear}>
              <SelectTrigger className="w-[110px] bg-white border-slate-200">
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {[2024, 2025, 2026].map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {selectedFolder ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setSelectedFolder(null); setPage(1); }}
                className="text-slate-500 hover:text-slate-900"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Voltar para Pastas
              </Button>
              <div className="flex items-center gap-2 text-sm font-bold text-primary-500 uppercase tracking-widest px-2">
                <Folder className="w-4 h-4 text-primary-400" />
                <span>
                  {(() => {
                    const current = groupedFolders.find((f) => f.key === selectedFolder);
                    return current ? `${getMonthName(current.month)} ${current.year}` : '';
                  })()}
                </span>
              </div>
            </div>

            <DataTable
              columns={columns}
              data={paginatedFolder}
              keyExtractor={(item) => item.id}
              isLoading={isLoading}
              isError={isError}
              errorMessage="Erro ao carregar processos."
              emptyMessage="Nenhum processo encontrado nesta pasta."
              pagination={{
                page,
                total: processoDataInFolder.length,
                limit,
                onPageChange: setPage,
                onLimitChange: setLimit,
              }}
            />
          </div>
        ) : searchTerm ? (
          <DataTable
            columns={columns}
            data={paginatedSearch}
            keyExtractor={(item) => item.id}
            isLoading={isLoading}
            isError={isError}
            errorMessage="Erro ao carregar processos."
            emptyMessage="Nenhum processo encontrado para sua busca."
            pagination={{
              page,
              total: filteredForSearch.length,
              limit,
              onPageChange: setPage,
              onLimitChange: setLimit,
            }}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-32 bg-slate-100 rounded-2xl animate-pulse" />
              ))
            ) : groupedFolders.length === 0 ? (
              <div className="col-span-full py-20 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                <Folder className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-400 font-medium">Nenhuma pasta encontrada.</p>
              </div>
            ) : (
              groupedFolders.map((folder) => (
                <button
                  key={folder.key}
                  onClick={() => { setSelectedFolder(folder.key); setPage(1); }}
                  className="group relative bg-white border border-slate-200 p-6 rounded-2xl text-left shadow-sm hover:shadow-xl hover:border-primary-400 hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                >
                  <Folder className="w-10 h-10 text-primary-500 mb-4 group-hover:scale-110 transition-transform" />

                  <div>
                    <h4 className="text-lg font-bold text-slate-800 tracking-tight group-hover:text-primary-600 transition-colors">
                      {getMonthName(folder.month)}
                    </h4>
                    <p className="text-sm font-black text-slate-400 uppercase tracking-widest">
                      {folder.year}
                    </p>
                  </div>

                  <div className="mt-6 flex items-center justify-between">
                    <span className="text-xs font-bold px-2 py-1 bg-slate-100 text-slate-600 rounded-md group-hover:bg-primary-50 group-hover:text-primary-700 transition-colors">
                      {folder.processos.length}{' '}
                      {folder.processos.length === 1 ? 'Processo' : 'Processos'}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-primary-400 group-hover:translate-x-1 transition-all" />
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <ProcessoFormModal
        open={isFormModalOpen}
        onOpenChange={setIsFormModalOpen}
        processo={editingProcesso}
      />

      <ConfirmDialog
        open={!!processoToDelete}
        onOpenChange={(open) => !open && setProcessoToDelete(null)}
        title="Excluir Processo"
        description={`Deseja realmente excluir a DTA ${processoToDelete?.dta}? Todos os containers vinculados também serão removidos.`}
        confirmText="Excluir"
        variant="destructive"
        onConfirm={async () => {
          if (processoToDelete) {
            await deleteMutation.mutateAsync(processoToDelete.id);
            setProcessoToDelete(null);
          }
        }}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
