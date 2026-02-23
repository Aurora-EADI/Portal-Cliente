'use client';

import { useMemo, useState } from 'react';
import { Eye, Edit, Plus, Ship, Trash2, Anchor, Building2 } from 'lucide-react';
import {
  DataTable,
  Column,
  SearchBar,
  PageHeader,
} from '@/components/ui/DataTable';
import { ActionButton } from '@/components/ui/ActionButton';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useProcessos, useDeleteProcesso } from '@/hooks/useDtaMaritime';
import { ProcessoImportacao } from '@/types/dtaMaritime';
import { formatDateBR } from '@/lib/date-format-utils';
import { ProcessoFormModal } from './modals/ProcessoFormModal';
import { DtaProcessoDetail } from './DtaProcessoDetail';

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
  const [selectedProcessoId, setSelectedProcessoId] = useState<string | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingProcesso, setEditingProcesso] = useState<ProcessoImportacao | null>(null);
  const [processoToDelete, setProcessoToDelete] = useState<ProcessoImportacao | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const { data: processos = [], isLoading, isError } = useProcessos();
  const deleteMutation = useDeleteProcesso();

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return processos;
    const term = searchTerm.toLowerCase();
    return processos.filter(
      (p) =>
        p.dta.toLowerCase().includes(term) ||
        p.empresa.toLowerCase().includes(term) ||
        p.porto?.toLowerCase().includes(term) ||
        p.navio?.toLowerCase().includes(term),
    );
  }, [processos, searchTerm]);

  const paginated = useMemo(() => {
    const start = (page - 1) * limit;
    return filtered.slice(start, start + limit);
  }, [filtered, page, limit]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setPage(1);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
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
      render: (item) => (
        <span className="text-slate-700">{item.empresa}</span>
      ),
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
      render: (item) => (
        <span className="text-slate-600">{item.navio || '—'}</span>
      ),
    },
    {
      key: 'ataDta',
      header: 'ATA DTA',
      render: (item) => (
        <span className="text-slate-600">{formatDateBR(item.ataDta)}</span>
      ),
    },
    {
      key: 'conclusao',
      header: 'Conclusão',
      render: (item) => (
        <span className="text-slate-600">{formatDateBR(item.conclusao)}</span>
      ),
    },
    {
      key: 'cifTotal',
      header: 'CIF Total',
      align: 'right',
      render: (item) => (
        <span className="font-semibold text-slate-800">
          {formatCurrency(item.cifTotal)}
        </span>
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
      key: 'actions',
      header: 'Ações',
      align: 'center',
      render: (item) => (
        <div
          className="flex justify-center gap-2"
          onClick={(e) => e.stopPropagation()}
        >
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

      <SearchBar
        placeholder="Buscar por DTA, empresa, porto ou navio..."
        onSearch={handleSearch}
        onClear={handleClearSearch}
        showClearButton={!!searchTerm}
      />

      <DataTable
        columns={columns}
        data={paginated}
        keyExtractor={(item) => item.id}
        isLoading={isLoading}
        isError={isError}
        errorMessage="Erro ao carregar processos de importação."
        emptyMessage="Nenhum processo encontrado."
        pagination={{
          page,
          total: filtered.length,
          limit,
          onPageChange: setPage,
          onLimitChange: setLimit,
        }}
      />

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
