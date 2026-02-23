"use client"

import React, { useMemo, useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useWorkforce } from '@/hooks/useWorkforce';
import { useUpdateWorkforceDocumentStatus } from '@/hooks/useWorkforceDocuments';
import { Badge } from '@/components/ui/Badge';
import { SearchBar } from '@/components/ui/DataTable';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { RejectionReasonModal } from '@/components/pages/documentos/modals/RejectionReasonModal';
import { DocumentStatus } from '@/types';
import { formatDateBR } from '@/lib/utils';
import { toast } from 'sonner';
import { workforceDocumentService } from '@/services/api';

type ModerationRow = {
  documentId: string;
  employeeId: string;
  employeeName: string;
  companyName: string;
  documentName: string;
  uploadedAt: string;
  dateExpiration?: string;
  status: DocumentStatus;
  rejectionReason?: string;
};

export function WorkforceDocumentsModeration() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | 'ALL'>(DocumentStatus.PENDING);
  const [approvingRow, setApprovingRow] = useState<ModerationRow | null>(null);
  const [rejectingRow, setRejectingRow] = useState<ModerationRow | null>(null);
  const limit = 10;

  const { data: workforceResponse, isLoading: isLoadingWorkforce } = useWorkforce({
    page,
    limit,
    search: search || undefined,
  });

  const workforce = workforceResponse?.data || [];
  const pagination = workforceResponse?.pagination;

  const workforceIdsKey = useMemo(
    () => workforce.map((item) => item.id).sort().join('|'),
    [workforce],
  );

  const {
    data: documentsByEmployee = {},
    isLoading: isLoadingDocuments,
    refetch: refetchDocuments,
  } = useQuery({
    queryKey: ['workforce-documents-moderation', workforceIdsKey],
    enabled: workforce.length > 0,
    queryFn: async () => {
      const entries = await Promise.all(
        workforce.map(async (employee) => {
          const docs = await workforceDocumentService.listByEmployee(employee.id, true);
          return [employee.id, docs] as const;
        }),
      );
      return Object.fromEntries(entries);
    },
  });

  const { mutateAsync: updateDocumentStatus, isPending: isUpdatingStatus } =
    useUpdateWorkforceDocumentStatus();

  const rows: ModerationRow[] = useMemo(() => {
    return workforce.flatMap((employee) => {
      const docs = documentsByEmployee[employee.id] || [];
      return docs.map((doc) => ({
        documentId: doc.id,
        employeeId: employee.id,
        employeeName: employee.fullName,
        companyName: employee.company.fantasyName,
        documentName: doc.documentType?.name || doc.name,
        uploadedAt: doc.uploadedAt,
        dateExpiration: doc.dateExpiration,
        status: doc.status,
        rejectionReason: doc.rejectionReason,
      }));
    });
  }, [documentsByEmployee, workforce]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (statusFilter !== 'ALL' && row.status !== statusFilter) return false;
      return true;
    });
  }, [rows, statusFilter]);

  const approveDocument = async (row: ModerationRow) => {
    try {
      await updateDocumentStatus({
        id: row.documentId,
        status: DocumentStatus.APPROVED,
        employeeId: row.employeeId,
      });
      toast.success('Documento aprovado com sucesso.');
      await refetchDocuments();
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao aprovar documento.');
    }
  };

  const rejectDocument = async (row: ModerationRow, reason: string) => {
    try {
      await updateDocumentStatus({
        id: row.documentId,
        status: DocumentStatus.REJECTED,
        rejectionReason: reason,
        employeeId: row.employeeId,
      });
      toast.success('Documento reprovado com sucesso.');
      await refetchDocuments();
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao reprovar documento.');
    }
  };

  const handleDownload = async (documentId: string) => {
    try {
      const url = await workforceDocumentService.getDownloadUrl(documentId);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao baixar documento.');
    }
  };

  const isLoading = isLoadingWorkforce || isLoadingDocuments;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Gestão de Documentos de Colaboradores</h1>
        <p className="text-gray-500">Aprove, reprove e baixe documentos sem abrir colaborador por colaborador.</p>
      </header>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-3">
        <SearchBar
          placeholder="Buscar por colaborador ou empresa"
          onSearch={(value) => {
            setSearch(value);
            setPage(1);
          }}
          onClear={() => {
            setSearch('');
            setStatusFilter(DocumentStatus.PENDING);
            setPage(1);
          }}
          showClearButton={!!(search || statusFilter !== DocumentStatus.PENDING)}
          initialValue={search}
        />

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as DocumentStatus | 'ALL')}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
          >
            <option value="PENDING">Pendente</option>
            <option value="APPROVED">Aprovado</option>
            <option value="REJECTED">Reprovado</option>
            <option value="ALL">Todos</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200">
            <tr>
              <th className="px-6 py-4">Documento</th>
              <th className="px-6 py-4">Colaborador</th>
              <th className="px-6 py-4">Empresa</th>
              <th className="px-6 py-4">Envio</th>
              <th className="px-6 py-4">Validade</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-6 py-10 text-center text-gray-400">
                  <Loader2 className="animate-spin mx-auto" />
                </td>
              </tr>
            ) : filteredRows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-10 text-center text-gray-400">
                  Nenhum documento encontrado para os filtros atuais.
                </td>
              </tr>
            ) : (
              filteredRows.map((row) => (
                <tr key={row.documentId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{row.documentName}</td>
                  <td className="px-6 py-4 text-gray-700">{row.employeeName}</td>
                  <td className="px-6 py-4 text-gray-700">{row.companyName}</td>
                  <td className="px-6 py-4 text-gray-600">{formatDateBR(row.uploadedAt)}</td>
                  <td className="px-6 py-4 text-gray-600">{formatDateBR(row.dateExpiration)}</td>
                  <td className="px-6 py-4">
                    <Badge status={row.status} context="document" />
                    {row.status === DocumentStatus.REJECTED && row.rejectionReason && (
                      <p className="text-xs text-red-600 mt-1">{row.rejectionReason}</p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {row.status === DocumentStatus.PENDING && (
                        <>
                          <button
                            type="button"
                            onClick={() => setRejectingRow(row)}
                            disabled={isUpdatingStatus}
                            className="px-2 py-1 rounded border border-red-300 text-red-700 hover:bg-red-50 text-xs disabled:opacity-50"
                          >
                            Reprovar
                          </button>
                          <button
                            type="button"
                            onClick={() => setApprovingRow(row)}
                            disabled={isUpdatingStatus}
                            className="px-2 py-1 rounded bg-green-600 text-white hover:bg-green-700 text-xs disabled:opacity-50"
                          >
                            Aprovar
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDownload(row.documentId)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded border border-gray-200 text-gray-700 hover:bg-gray-50"
                      >
                        <Download size={14} />
                        Baixar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Página {pagination.page} de {Math.max(1, pagination.totalPages)}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={pagination.page <= 1}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => p + 1)}
              disabled={!pagination.hasNext}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Próxima
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!approvingRow}
        onOpenChange={(open) => !open && setApprovingRow(null)}
        title="Aprovar Documento"
        description={`Deseja realmente aprovar o documento "${approvingRow?.documentName || ''}"?`}
        confirmText="Aprovar"
        cancelText="Cancelar"
        variant="default"
        onConfirm={async () => {
          if (!approvingRow) return;
          await approveDocument(approvingRow);
          setApprovingRow(null);
        }}
        isLoading={isUpdatingStatus}
      />

      <RejectionReasonModal
        open={!!rejectingRow}
        onOpenChange={(open) => !open && setRejectingRow(null)}
        document={rejectingRow ? { name: rejectingRow.documentName } : null}
        onConfirm={async (reason) => {
          if (!rejectingRow) return;
          await rejectDocument(rejectingRow, reason.trim());
          setRejectingRow(null);
        }}
        isLoading={isUpdatingStatus}
      />
    </div>
  );
}
