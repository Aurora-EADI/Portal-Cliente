import React, { useMemo, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import {
  Eye,
  Loader2,
  Plus,
  X,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  FileText,
  XCircle,
} from "lucide-react";
import {
  DataTable,
  Column,
  PageHeader,
  SearchBar,
} from "@/components/ui/DataTable";
import { ActionButton } from "@/components/ui/ActionButton";
import { useCreateWorkforceEmployee, useWorkforce } from "@/hooks/useWorkforce";
import { workforceDocumentService, WorkforceListItemDto } from "@/services/api";
import { useAuthContext } from "@/context/AuthContext";
import { UserRole, EmployeeStatus } from "@/types";
import { formatCPF } from "@/lib/utils";
import { WorkforceDetailsModal } from "./components/WorkforceDetailsModal";
import { toast } from "sonner";

interface WorkforceListProps {
  companyId?: string;
  hideCompanyColumn?: boolean;
  title?: string;
  description?: string;
  showAddButton?: boolean;
}

function getStatusLabel(status: EmployeeStatus) {
  return status === EmployeeStatus.ACTIVE ? "Ativo" : "Inativo";
}

function maskCpf(cpf: string) {
  const digits = cpf.replace(/\D/g, "");
  const formatted = formatCPF(digits);
  return formatted.replace(/^\d{3}\.\d{3}\.\d{3}-(\d{2})$/, "***.***.***-$1");
}

export function WorkforceList({
  companyId,
  hideCompanyColumn = false,
  title: propTitle,
  description: propDescription,
  showAddButton = false,
}: WorkforceListProps) {
  const { currentUser } = useAuthContext();
  const isSupplier = currentUser?.role === UserRole.SUPPLIER;

  const title = propTitle || (isSupplier ? "Documentos de Colaboradores" : "Lista de Terceiros");
  const description = propDescription || (isSupplier ? "Acompanhe e envie os documentos dos seus colaboradores." : "Visualize e gerencie colaboradores terceirizados dos fornecedores.");
  const todayIso = new Date().toISOString().split("T")[0];
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "ACTIVE" | "INACTIVE" | "PENDING"
  >("ALL");
  const [selectedWorkforceId, setSelectedWorkforceId] = useState<string | null>(
    null,
  );
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [cpf, setCpf] = useState("");
  const [position, setPosition] = useState("");
  const [hiredAt, setHiredAt] = useState("");
  const limit = 10;
  const { mutateAsync: createEmployee, isPending: isCreating } =
    useCreateWorkforceEmployee();

  const { data, isLoading, isError } = useWorkforce({
    page,
    limit,
    search: search || undefined,
    status:
      statusFilter === "ACTIVE"
        ? EmployeeStatus.ACTIVE
        : statusFilter === "INACTIVE"
          ? EmployeeStatus.INACTIVE
          : undefined,
    onlyPending: statusFilter === "PENDING" ? true : undefined,
    companyId,
  });

  const workforce = data?.data || [];
  const pagination = data?.pagination;
  const missingRequirementsQueries = useQueries({
    queries: workforce.map((item) => ({
      queryKey: ["workforce-documents", "missing", item.id],
      queryFn: async () =>
        workforceDocumentService.listMissingByEmployee(item.id),
      enabled: !!item.id,
    })),
  });

  const derivedPendingByEmployeeId = useMemo(() => {
    const map = new Map<string, boolean>();

    workforce.forEach((item, index) => {
      const missingRequirements = missingRequirementsQueries[index]?.data || [];
      map.set(
        item.id,
        Boolean(item.hasPendingDocuments) || missingRequirements.length > 0,
      );
    });

    return map;
  }, [workforce, missingRequirementsQueries]);

  const hasVisiblePendingDocuments = useMemo(
    () => workforce.some((item) => derivedPendingByEmployeeId.get(item.id)),
    [derivedPendingByEmployeeId, workforce],
  );

  const columns: Column<WorkforceListItemDto>[] = useMemo(() => {
    const baseColumns: Column<WorkforceListItemDto>[] = [
      {
        key: "fullName",
        header: "Nome Completo",
        render: (item) => (
          <span className="font-medium text-gray-900">{item.fullName}</span>
        ),
      },
      {
        key: "cpf",
        header: "CPF",
        render: (item) => (
          <span className="text-gray-700">{maskCpf(item.cpf)}</span>
        ),
      },
      {
        key: "position",
        header: "Funcao",
        render: (item) => (
          <span className="text-gray-700">{item.position}</span>
        ),
      },
      {
        key: "status",
        header: "Status",
        render: (item) => (
          <span
            className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold ${
              item.status === EmployeeStatus.ACTIVE
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {getStatusLabel(item.status)}
          </span>
        ),
      },
      {
        key: "docStatus",
        header: "Status Documental",
        render: (item) => {
          const hasPendingDocuments =
            derivedPendingByEmployeeId.get(item.id) ??
            Boolean(item.hasPendingDocuments);

          return (
            <span
              className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold ${
                hasPendingDocuments
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-green-100 text-green-800"
              }`}
            >
              {hasPendingDocuments ? "Com Pendência" : "Regular"}
            </span>
          );
        },
      },
      {
        key: "actions",
        header: "Acoes",
        align: "center",
        render: (item) => (
          <ActionButton
            onClick={() => setSelectedWorkforceId(item.id)}
            icon={<Eye size={16} />}
            className="border-gray-200"
          >
            Detalhes
          </ActionButton>
        ),
      },
    ];

    if (!hideCompanyColumn) {
      baseColumns.splice(3, 0, {
        key: "company",
        header: "Empresa",
        render: (item) => (
          <div>
            <div className="font-medium text-gray-900">
              {item.company.fantasyName}
            </div>
            <div className="text-xs text-gray-500">
              {item.company.socialReason || "-"}
            </div>
          </div>
        ),
      });
    }

    return baseColumns;
  }, [derivedPendingByEmployeeId, hideCompanyColumn]);

  const onSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
    setPage(1);
  };

  const resetCreateForm = () => {
    setFullName("");
    setCpf("");
    setPosition("");
    setHiredAt("");
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
    resetCreateForm();
  };

  const handleCpfChange = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    setCpf(formatCPF(digits));
  };

  const handleCreateEmployee = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!companyId) {
      toast.error("Não foi possível identificar a empresa do fornecedor.");
      return;
    }

    const cleanCpf = cpf.replace(/\D/g, "");
    if (cleanCpf.length !== 11) {
      toast.error("Informe um CPF válido com 11 dígitos.");
      return;
    }

    if (hiredAt > todayIso) {
      toast.error("A data de admissão não pode ser posterior ao dia de hoje.");
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

      toast.success("Colaborador adicionado com sucesso.");
      handleCloseCreateModal();
    } catch (error: any) {
      toast.error(error?.message || "Erro ao adicionar colaborador.");
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

      {/* Alerta de pendência global */}
      {((data?.statusCounts?.pending ?? 0) > 0 ||
        hasVisiblePendingDocuments) && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 animate-in slide-in-from-top-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-orange-100 rounded-lg text-orange-600 shrink-0">
              <AlertTriangle size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-orange-900 mb-2">
                Documentação Pendente
              </h3>
              <p className="text-sm text-orange-800">
                Lembramos que existem colaboradores com documentos pendentes ou
                reprovados. Regularize a situação acessando os detalhes de cada
                colaborador para evitar bloqueios.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Metric cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-2">
        {/* Card: Total */}
        <button
          type="button"
          onClick={() => setStatusFilter("ALL")}
          className={`bg-white p-6 rounded-xl border transition-all text-left flex items-center gap-4 ${
            statusFilter === "ALL"
              ? "border-blue-500 ring-2 ring-blue-500/20 shadow-md"
              : "border-gray-200 shadow-sm hover:border-blue-300 hover:shadow-md"
          }`}
        >
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
            <FileText size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">
              Total de colaboradores
            </p>
            <p className="text-2xl font-bold text-gray-900">
              {data?.statusCounts?.total ?? 0}
            </p>
          </div>
        </button>

        {/* Card: Ativos */}
        <button
          type="button"
          onClick={() => setStatusFilter("ACTIVE")}
          className={`bg-white p-6 rounded-xl border transition-all text-left flex items-center gap-4 ${
            statusFilter === "ACTIVE"
              ? "border-green-500 ring-2 ring-green-500/20 shadow-md"
              : "border-gray-200 shadow-sm hover:border-green-300 hover:shadow-md"
          }`}
        >
          <div className="p-3 bg-green-100 text-green-600 rounded-lg">
            <CheckCircle size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Ativos</p>
            <p className="text-2xl font-bold text-gray-900">
              {data?.statusCounts?.active ?? 0}
            </p>
          </div>
        </button>

        {/* Card: Pendentes */}
        <button
          type="button"
          onClick={() => setStatusFilter("PENDING")}
          className={`bg-white p-6 rounded-xl border transition-all text-left flex items-center gap-4 ${
            statusFilter === "PENDING"
              ? "border-yellow-500 ring-2 ring-yellow-500/20 shadow-md"
              : "border-gray-200 shadow-sm hover:border-yellow-300 hover:shadow-md"
          }`}
        >
          <div className="p-3 bg-yellow-100 text-yellow-600 rounded-lg">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Com Pendência</p>
            <p className="text-2xl font-bold text-gray-900">
              {data?.statusCounts?.pending ?? 0}
            </p>
          </div>
        </button>

        {/* Card: Inativos */}
        <button
          type="button"
          onClick={() => setStatusFilter("INACTIVE")}
          className={`bg-white p-6 rounded-xl border transition-all text-left flex items-center gap-4 ${
            statusFilter === "INACTIVE"
              ? "border-red-500 ring-2 ring-red-500/20 shadow-md"
              : "border-gray-200 shadow-sm hover:border-red-300 hover:shadow-md"
          }`}
        >
          <div className="p-3 bg-red-100 text-red-600 rounded-lg">
            <XCircle size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Inativos</p>
            <p className="text-2xl font-bold text-gray-900">
              {data?.statusCounts?.inactive ?? 0}
            </p>
          </div>
        </button>
      </div>

      <div className="space-y-3">
        <SearchBar
          placeholder="Buscar por nome, CPF, funcao ou empresa"
          onSearch={onSearch}
          onClear={clearFilters}
          showClearButton={!!(search || statusFilter !== "ALL")}
          initialValue={search}
        />
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
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleCloseCreateModal}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">
                Adicionar colaborador
              </h3>
              <button
                onClick={handleCloseCreateModal}
                className="p-2 hover:bg-gray-100 rounded-full text-gray-500"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateEmployee} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome completo
                </label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CPF
                  </label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data de admissão
                  </label>
                  <input
                    type="date"
                    value={hiredAt}
                    max={todayIso}
                    onChange={(e) =>
                      setHiredAt(
                        e.target.value > todayIso ? todayIso : e.target.value,
                      )
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    required
                    disabled={isCreating}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Função
                </label>
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
                    "Adicionar"
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
