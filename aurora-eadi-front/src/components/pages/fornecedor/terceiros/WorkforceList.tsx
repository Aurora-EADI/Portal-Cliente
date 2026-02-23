import React, { useMemo, useState } from 'react';
import { Eye, Loader2, Plus, X } from 'lucide-react';
import { DataTable, Column, PageHeader, SearchBar } from '@/components/ui/DataTable';
import { useCreateWorkforceEmployee, useWorkforce } from '@/hooks/useWorkforce';
import { WorkforceListItemDto } from '@/services/api';
import { EmployeeStatus } from '@/types';
import { formatCPF } from '@/lib/utils';
import { WorkforceDetailsModal } from './components/WorkforceDetailsModal';
import { toast } from 'sonner';

interface WorkforceListProps {
  companyId?: string;
  hideCompanyColumn?: boolean;
  title?: string;
  description?: string;
  showAddButton?: boolean;
}

function getStatusLabel(status: EmployeeStatus) {
  return status === EmployeeStatus.ACTIVE ? 'Ativo' : 'Inativo';
}

function maskCpf(cpf: string) {
  const digits = cpf.replace(/\D/g, '');
  const formatted = formatCPF(digits);
  return formatted.replace(/^\d{3}\.\d{3}\.\d{3}-(\d{2})$/, '***.***.***-$1');
}

export function WorkforceList({
  companyId,
  hideCompanyColumn = false,
  title = 'Lista de Terceiros',
  description = 'Visualize e gerencie colaboradores terceirizados dos fornecedores.',
  showAddButton = false,
}: WorkforceListProps) {
  const todayIso = new Date().toISOString().split('T')[0];
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('');
  const [selectedWorkforceId, setSelectedWorkforceId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [cpf, setCpf] = useState('');
  const [position, setPosition] = useState('');
  const [hiredAt, setHiredAt] = useState('');
  const limit = 10;
  const { mutateAsync: createEmployee, isPending: isCreating } = useCreateWorkforceEmployee();

  const { data, isLoading, isError } = useWorkforce({
    page,
    limit,
    search: search || undefined,
    status: status || undefined,
    companyId,
  });

  const workforce = data?.data || [];
  const pagination = data?.pagination;

  const columns: Column<WorkforceListItemDto>[] = useMemo(
    () => {
      const baseColumns: Column<WorkforceListItemDto>[] = [
      {
        key: 'fullName',
        header: 'Nome Completo',
        render: (item) => <span className="font-medium text-gray-900">{item.fullName}</span>,
      },
      {
        key: 'cpf',
        header: 'CPF',
        render: (item) => <span className="text-gray-700">{maskCpf(item.cpf)}</span>,
      },
      {
        key: 'position',
        header: 'Funcao',
        render: (item) => <span className="text-gray-700">{item.position}</span>,
      },
      {
        key: 'status',
        header: 'Status',
        render: (item) => (
          <span
            className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold ${
              item.status === EmployeeStatus.ACTIVE
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {getStatusLabel(item.status)}
          </span>
        ),
      },
      {
        key: 'actions',
        header: 'Acoes',
        align: 'center',
        render: (item) => (
          <button
            onClick={() => setSelectedWorkforceId(item.id)}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 hover:border-primary-500 hover:text-primary-600 rounded-lg text-sm font-medium text-gray-700 transition-all shadow-sm"
          >
            <Eye size={16} />
            Detalhes
          </button>
        ),
      },
      ];

      if (!hideCompanyColumn) {
        baseColumns.splice(3, 0, {
          key: 'company',
          header: 'Empresa',
          render: (item) => (
            <div>
              <div className="font-medium text-gray-900">{item.company.fantasyName}</div>
              <div className="text-xs text-gray-500">{item.company.socialReason || '-'}</div>
            </div>
          ),
        });
      }

      return baseColumns;
    },
    [hideCompanyColumn],
  );

  const onSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const clearFilters = () => {
    setSearch('');
    setStatus('');
    setPage(1);
  };

  const resetCreateForm = () => {
    setFullName('');
    setCpf('');
    setPosition('');
    setHiredAt('');
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
    resetCreateForm();
  };

  const handleCpfChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    setCpf(formatCPF(digits));
  };

  const handleCreateEmployee = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!companyId) {
      toast.error('Não foi possível identificar a empresa do fornecedor.');
      return;
    }

    const cleanCpf = cpf.replace(/\D/g, '');
    if (cleanCpf.length !== 11) {
      toast.error('Informe um CPF válido com 11 dígitos.');
      return;
    }

    if (hiredAt > todayIso) {
      toast.error('A data de admissão não pode ser posterior ao dia de hoje.');
      return;
    }

    try {
      await createEmployee({
        companyId,
        employee: {
          fullName: fullName.trim(),
          cpf: cleanCpf,
          position: position.trim(),
          hiredAt,
          status: EmployeeStatus.ACTIVE,
        },
      });

      toast.success('Colaborador adicionado com sucesso.');
      handleCloseCreateModal();
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao adicionar colaborador.');
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <PageHeader
        title={title}
        description={description}
        actions={
          showAddButton && companyId ? (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-primary-200/50"
            >
              <Plus size={16} />
              Adicionar colaborador
            </button>
          ) : undefined
        }
      />

      <div className="space-y-3">
        <SearchBar
          placeholder="Buscar por nome, CPF, funcao ou empresa"
          onSearch={onSearch}
          onClear={clearFilters}
          showClearButton={!!(search || status)}
          initialValue={search}
        />

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-700 font-medium whitespace-nowrap">Status</label>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm"
            >
              <option value="">Todos</option>
              <option value={EmployeeStatus.ACTIVE}>Ativo</option>
              <option value={EmployeeStatus.INACTIVE}>Inativo</option>
            </select>
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={workforce}
        keyExtractor={(item) => item.id}
        isLoading={isLoading}
        isError={isError}
        errorMessage="Erro ao carregar terceiros."
        emptyMessage="Nenhum terceiro encontrado."
        pagination={
          pagination
            ? {
                page,
                total: pagination.total,
                limit,
                onPageChange: setPage,
              }
            : undefined
        }
      />

      {selectedWorkforceId && (
        <WorkforceDetailsModal
          workforceId={selectedWorkforceId}
          onClose={() => setSelectedWorkforceId(null)}
        />
      )}

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleCloseCreateModal} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Adicionar colaborador</h3>
              <button onClick={handleCloseCreateModal} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateEmployee} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  required
                  disabled={isCreating}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
                  <input
                    type="text"
                    value={cpf}
                    onChange={(e) => handleCpfChange(e.target.value)}
                    placeholder="000.000.000-00"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    required
                    disabled={isCreating}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data de admissão</label>
                  <input
                    type="date"
                    value={hiredAt}
                    max={todayIso}
                    onChange={(e) =>
                      setHiredAt(e.target.value > todayIso ? todayIso : e.target.value)
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    required
                    disabled={isCreating}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Função</label>
                <input
                  type="text"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  required
                  disabled={isCreating}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCloseCreateModal}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                  disabled={isCreating}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50"
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Adicionar'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


