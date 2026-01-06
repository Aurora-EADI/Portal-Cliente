"use client"

import React, { useState } from 'react';
import { useAuthContext } from '../../../context/AuthContext';
import { useActiveCompanies, useUpdateCompanyStatus } from '../../../hooks/useSuppliers';
import { useDocuments, useUpdateDocumentStatus } from '../../../hooks/useDocuments';
import { Badge } from '../../ui/Badge';
import { DocumentStatus, Document, CompanyStatus, Company } from '../../../types';
import { documentService, documentTypeService, companyRequirementService } from '../../../services/api';
import { Search, Eye, Check, X, FileText, Download, Building2, AlertCircle, AlertTriangle, CheckCircle2, ShieldCheck, ChevronLeft, ChevronRight, Loader2, Clock, Calendar } from 'lucide-react';
import { ConfirmDialog } from '../../ui/ConfirmDialog';
import { Pagination } from '../../ui/Pagination';
import { DocumentsHistoryModal } from './modals/DocumentsHistoryModal';
import { RejectionReasonModal } from './modals/RejectionReasonModal';
import { CompanyDetailsModal } from './modals/CompanyDetailsModal';

export function AdminDashboard() {
  const { currentUser } = useAuthContext();

  // Queries
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const limit = 10;

  // Queries
  const { data: suppliersResponse, isLoading: isLoadingSuppliers } = useActiveCompanies({
    page,
    limit,
    search: searchTerm
  });

  const suppliers = suppliersResponse?.data || [];
  const pagination = suppliersResponse?.pagination;

  const { data: documents = [] } = useDocuments(currentUser);

  // Mutations
  const { mutate: updateCompany, isPending: isUpdatingCompany } = useUpdateCompanyStatus();
  const { mutate: updateDoc, isPending: isUpdatingDoc } = useUpdateDocumentStatus();

  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [viewingCompany, setViewingCompany] = useState<Company | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchTerm(searchInput);
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  // Requirements State (modal Detalhes)
  const [documentTypes, setDocumentTypes] = useState<{ id: number; name: string }[]>([]);
  const [companyRequirements, setCompanyRequirements] = useState<Set<number>>(new Set());
  const [isLoadingRequirements, setIsLoadingRequirements] = useState(false);

  // Requirements State (modal Documentos)
  const [modalDocRequirements, setModalDocRequirements] = useState<{ documentTypeId: number; documentType: { id: number; name: string }; isRequired: boolean }[]>([]);
  const [isLoadingModalReqs, setIsLoadingModalReqs] = useState(false);

  const loadRequirements = async (companyId: string) => {
    try {
      setIsLoadingRequirements(true);
      const [types, reqs] = await Promise.all([
        documentTypeService.getAll(),
        companyRequirementService.getRequirements(companyId)
      ]);
      setDocumentTypes(types);
      setCompanyRequirements(new Set(reqs.filter(r => r.isRequired).map(r => r.documentTypeId)));
    } catch (error) {
      console.error('Erro ao carregar requisitos:', error);
      alert('Erro ao carregar requisitos.');
    } finally {
      setIsLoadingRequirements(false);
    }
  };

  // Carrega requisitos quando abre o modal de Documentos
  React.useEffect(() => {
    if (selectedSupplierId) {
      loadModalRequirements(selectedSupplierId);
    }
  }, [selectedSupplierId]);

  const loadModalRequirements = async (companyId: string) => {
    try {
      setIsLoadingModalReqs(true);
      const [types, reqs] = await Promise.all([
        documentTypeService.getAll(),
        companyRequirementService.getRequirements(companyId)
      ]);
      setDocumentTypes(types); // ← Salvar tipos de documentos no estado
      const reqsWithType = reqs.filter(r => r.isRequired).map(r => ({
        ...r,
        documentType: types.find(t => t.id === r.documentTypeId) || { id: r.documentTypeId, name: 'Desconhecido' }
      }));
      setModalDocRequirements(reqsWithType);
    } catch (error) {
      console.error('Erro ao carregar requisitos do modal:', error);
    } finally {
      setIsLoadingModalReqs(false);
    }
  };

  const getPendingRequirements = () => {
    return modalDocRequirements.filter(req => {
      const hasApprovedDoc = selectedDocs.some(
        d => d.documentTypeId === req.documentTypeId && d.status === DocumentStatus.APPROVED
      );
      return !hasApprovedDoc;
    });
  };

  const toggleRequirement = async (typeId: number) => {
    if (!viewingCompany) return;
    const isRequired = !companyRequirements.has(typeId);
    const newSet = new Set(companyRequirements);
    if (isRequired) newSet.add(typeId);
    else newSet.delete(typeId);

    setCompanyRequirements(newSet);

    try {
      await companyRequirementService.updateRequirements(String(viewingCompany.id), [{ documentTypeId: typeId, isRequired }]);
    } catch (error) {
      console.error('Erro ao atualizar requisito:', error);
      alert('Erro ao atualizar requisito.');
      loadRequirements(String(viewingCompany.id));
    }
  };

  // Rejection State
  const [rejectingDoc, setRejectingDoc] = useState<Document | null>(null);

  // Confirm Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: 'approveDoc' | 'blockCompany' | null;
    data: any;
  }>({ open: false, type: null, data: null });

  const getValidityStatus = (dateExpiration?: string) => {
    if (!dateExpiration) return 'OK';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exp = new Date(dateExpiration);
    exp.setHours(0, 0, 0, 0);

    const diffTime = exp.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'EXPIRED';
    if (diffDays <= 15) return 'ALERT';
    return 'OK';
  };

  const selectedData = selectedSupplierId
    ? suppliers.find((s: Company) => String(s.id) === selectedSupplierId)
    : null;

  const selectedDocs = selectedSupplierId
    ? documents.filter(d => d.companyId === selectedSupplierId)
    : [];

  const getDocStats = (companyId: string) => {
    const docs = documents.filter(d => d.companyId === companyId);
    const pending = docs.filter(d => d.status === DocumentStatus.PENDING).length;

    let status: 'OK' | 'ALERT' | 'EXPIRED' | undefined;

    // Filtra documentos rejeitados antes de verificar validade
    // Documentos rejeitados não devem influenciar o status de validade
    const nonRejectedDocs = docs.filter(d => d.status !== DocumentStatus.REJECTED);

    for (const doc of nonRejectedDocs) {
      const s = getValidityStatus(doc.dateExpiration);
      if (s === 'EXPIRED') {
        status = 'EXPIRED';
        break;
      }
      if (s === 'ALERT' && status !== 'EXPIRED') {
        status = 'ALERT';
      }
    }

    return { total: docs.length, pending, hasPending: pending > 0, status };
  };

  const handleApprove = (doc: Document) => {
    setConfirmDialog({
      open: true,
      type: 'approveDoc',
      data: doc
    });
  };

  const handleCompanyAuthorization = (companyId: string, status: CompanyStatus) => {
    if (status === CompanyStatus.REJECTED) {
      setConfirmDialog({
        open: true,
        type: 'blockCompany',
        data: companyId
      });
      return;
    }
    updateCompany({ id: companyId, status });
  };

  const handleConfirmAction = () => {
    if (confirmDialog.type === 'approveDoc' && confirmDialog.data) {
      updateDoc({ id: confirmDialog.data.id, status: DocumentStatus.APPROVED });
    } else if (confirmDialog.type === 'blockCompany' && confirmDialog.data) {
      updateCompany({ id: confirmDialog.data, status: CompanyStatus.REJECTED });
    }
    setConfirmDialog({ open: false, type: null, data: null });
  };

  const handleRejectConfirm = (reason: string) => {
    if (rejectingDoc) {
      updateDoc({ id: rejectingDoc.id, status: DocumentStatus.REJECTED, reason });
      setRejectingDoc(null);
    }
  };

  const handleCompanyTabChange = (tab: 'info' | 'requirements') => {
    if (tab === 'requirements' && viewingCompany && documentTypes.length === 0) {
      loadRequirements(String(viewingCompany.id));
    }
  };

  const handleDownload = async (docId: string) => {
    try {
      const url = await documentService.getDownloadUrl(docId);
      window.open(url, '_blank');
    } catch (error: any) {
      console.error('Erro ao fazer download:', error);
      const message = error.message || 'Erro ao fazer download do documento';
      alert(message);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* Header */}
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Gestão de Documentos</h1>
        <p className="text-gray-500">Gerencie e modere documentos.</p>
      </header>

      {/* Filter */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Buscar fornecedor por Razão Social, CNPJ ou Responsável..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Main Table: Supplier List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200">
            <tr>
              <th className="px-6 py-4">Empresa</th>
              <th className="px-6 py-4">Docs Pendentes</th>
              <th className="px-6 py-4">Status Docs</th>
              <th colSpan={2} className="px-6 py-4 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {suppliers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                  Nenhuma empresa encontrada.
                </td>
              </tr>
            ) : (
              suppliers.map((company: Company) => {
                const docStats = getDocStats(String(company.id));
                return (
                  <tr key={company.id} className={`hover:bg-gray-50 transition-colors group`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
                          <Building2 size={20} />
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-gray-900 truncate">{company.fantasyName}</div>
                          <div className="text-xs text-gray-500">{company.cnpj}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {docStats.hasPending ? (
                        <span className="text-yellow-600 font-medium flex items-center gap-1">
                          <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
                          {docStats.pending} pendentes
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {docStats.status === 'EXPIRED' && (
                        <div className="flex items-center gap-1 text-red-600 font-medium" title="Existem documentos vencidos">
                          <AlertCircle size={18} />
                          <span>Vencido</span>
                        </div>
                      )}
                      {docStats.status === 'ALERT' && (
                        <div className="flex items-center gap-1 text-yellow-600 font-medium" title="Existem documentos a vencer">
                          <AlertTriangle size={18} />
                          <span>Alerta</span>
                        </div>
                      )}
                      {docStats.status === 'OK' && (
                        <div className="text-green-500" title="Documentação em dia">
                          <CheckCircle2 size={18} />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedSupplierId(String(company.id))}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 hover:border-primary-500 hover:text-primary-600 rounded-lg text-sm font-medium text-gray-700 transition-all shadow-sm"
                      >
                        <FileText size={16} />
                        Documentos
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setViewingCompany(company)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 hover:border-primary-500 hover:text-primary-600 rounded-lg text-sm font-medium text-gray-700 transition-all shadow-sm"
                      >
                        <Eye size={16} />
                        Detalhes
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {pagination && (
        <Pagination
          page={page}
          total={pagination.total}
          limit={limit}
          onPageChange={handlePageChange}
        />
      )}

      {/* Modal Components */}
      <DocumentsHistoryModal
        open={!!selectedData}
        onOpenChange={(open) => !open && setSelectedSupplierId(null)}
        company={selectedData!}
        documents={selectedDocs}
        documentTypes={documentTypes}
        requirements={modalDocRequirements}
        onApprove={handleApprove}
        onReject={setRejectingDoc}
        onDownload={handleDownload}
        isUpdating={isUpdatingDoc}
        isLoadingRequirements={isLoadingModalReqs}
      />

      <RejectionReasonModal
        open={!!rejectingDoc}
        onOpenChange={(open) => !open && setRejectingDoc(null)}
        document={rejectingDoc}
        onConfirm={handleRejectConfirm}
        isLoading={isUpdatingDoc}
      />

      <CompanyDetailsModal
        open={!!viewingCompany}
        onOpenChange={(open) => !open && setViewingCompany(null)}
        company={viewingCompany}
        documentTypes={documentTypes}
        companyRequirements={companyRequirements}
        isLoadingRequirements={isLoadingRequirements}
        onRequirementToggle={toggleRequirement}
        onTabChange={handleCompanyTabChange}
      />

      {/* ConfirmDialog para Aprovar Documento */}
      <ConfirmDialog
        open={confirmDialog.open && confirmDialog.type === 'approveDoc'}
        onOpenChange={(open) => !open && setConfirmDialog({ open: false, type: null, data: null })}
        title="Aprovar Documento"
        description={`Deseja realmente aprovar o documento "${confirmDialog.data?.name || ''}"?`}
        confirmText="Aprovar"
        cancelText="Cancelar"
        variant="default"
        onConfirm={handleConfirmAction}
        isLoading={isUpdatingDoc}
      />

      {/* ConfirmDialog para Bloquear Empresa */}
      <ConfirmDialog
        open={confirmDialog.open && confirmDialog.type === 'blockCompany'}
        onOpenChange={(open) => !open && setConfirmDialog({ open: false, type: null, data: null })}
        title="Bloquear Empresa"
        description="Deseja realmente bloquear o acesso desta empresa? Esta ação pode ser revertida posteriormente."
        confirmText="Bloquear"
        cancelText="Cancelar"
        variant="destructive"
        onConfirm={handleConfirmAction}
        isLoading={isUpdatingCompany}
      />
    </div>
  );
};