"use client"

import React, { useState } from 'react';
import { useAuthContext } from '../../../context/AuthContext';
import { useSuppliers, useUpdateCompanyStatus } from '../../../hooks/useSuppliers';
import { useDocuments, useUpdateDocumentStatus } from '../../../hooks/useDocuments';
import { Badge } from '../../ui/Badge';
import { DocumentStatus, Document, CompanyStatus } from '../../../types';
import { CompanyWithResponsible, documentService, documentTypeService, companyRequirementService } from '../../../services/api';
import { Search, Eye, Check, X, FileText, Download, Building2, User as UserIcon, AlertCircle, Users, UserCheck, Clock, Loader2, AlertTriangle, CheckCircle2, ShieldCheck } from 'lucide-react';

export function AdminDashboard() {
  const { currentUser } = useAuthContext();

  // Queries
  const { data: suppliers = [] } = useSuppliers();
  const { data: documents = [] } = useDocuments(currentUser);

  // Mutations
  const { mutate: updateCompany, isPending: isUpdatingCompany } = useUpdateCompanyStatus();
  const { mutate: updateDoc, isPending: isUpdatingDoc } = useUpdateDocumentStatus();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [viewingCompany, setViewingCompany] = useState<CompanyWithResponsible | null>(null);

  // Requirements State
  const [activeTab, setActiveTab] = useState<'info' | 'requirements'>('info');
  const [documentTypes, setDocumentTypes] = useState<{ id: number; name: string }[]>([]);
  const [companyRequirements, setCompanyRequirements] = useState<Set<number>>(new Set());
  const [isLoadingRequirements, setIsLoadingRequirements] = useState(false);

  React.useEffect(() => {
    if (viewingCompany && activeTab === 'requirements') {
      loadRequirements(String(viewingCompany.company.id));
    }
  }, [viewingCompany, activeTab]);

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

  const toggleRequirement = async (typeId: number) => {
    if (!viewingCompany) return;
    const isRequired = !companyRequirements.has(typeId);
    const newSet = new Set(companyRequirements);
    if (isRequired) newSet.add(typeId);
    else newSet.delete(typeId);

    setCompanyRequirements(newSet); // Optimistic update

    try {
      await companyRequirementService.updateRequirements(String(viewingCompany.company.id), [{ documentTypeId: typeId, isRequired }]);
    } catch (error) {
      console.error('Erro ao atualizar requisito:', error);
      alert('Erro ao atualizar requisito.');
      loadRequirements(String(viewingCompany.company.id)); // Revert on error
    }
  };

  // Rejection State
  const [rejectingDoc, setRejectingDoc] = useState<Document | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const pendingCompanies = suppliers.filter((s: CompanyWithResponsible) => s.company.status === CompanyStatus.PENDING).length;
  const activeCompanies = suppliers.filter((s: CompanyWithResponsible) => s.company.status === CompanyStatus.ACTIVE).length;
  const totalCompanies = suppliers.length;

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


  const filteredSuppliers = suppliers.filter(({ company, responsible }) => {
    const term = searchTerm.toLowerCase();
    return (
      company.fantasyName.toLowerCase().includes(term) ||
      company.cnpj.includes(term) ||
      (responsible && responsible.name.toLowerCase().includes(term))
    );
  });


  const selectedData = selectedSupplierId
    ? suppliers.find(s => String(s.company.id) === selectedSupplierId)
    : null;

  const selectedDocs = selectedSupplierId
    ? documents.filter(d => d.companyId === selectedSupplierId)
    : [];


  const getDocStats = (companyId: string) => {
    const docs = documents.filter(d => d.companyId === companyId);
    const pending = docs.filter(d => d.status === DocumentStatus.PENDING).length;

    // Status Agregado
    let status: 'OK' | 'ALERT' | 'EXPIRED' | undefined;

    for (const doc of docs) {
      const s = getValidityStatus(doc.dateExpiration);
      if (s === 'EXPIRED') {
        status = 'EXPIRED';
        break; // Prioridade máxima
      }
      if (s === 'ALERT' && status !== 'EXPIRED') {
        status = 'ALERT';
      }
    }

    return { total: docs.length, pending, hasPending: pending > 0, status };
  };

  const handleApprove = (doc: Document) => {
    if (window.confirm(`Aprovar documento "${doc.name}"?`)) {
      updateDoc({ id: doc.id, status: DocumentStatus.APPROVED });
    }
  };

  const handleCompanyAuthorization = (companyId: string, status: CompanyStatus) => {
    if (status === CompanyStatus.REJECTED && !window.confirm(`Deseja realmente bloquear o acesso desta empresa?`)) {
      return;
    }
    updateCompany({ id: companyId, status });
  };

  const handleRejectSubmit = () => {
    if (rejectingDoc && rejectionReason.trim()) {
      updateDoc({ id: rejectingDoc.id, status: DocumentStatus.REJECTED, reason: rejectionReason });
      setRejectingDoc(null);
      setRejectionReason('');
    }
  };

  const handleDownload = async (docId: string) => {
    try {
      const url = await documentService.getDownloadUrl(docId);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Erro ao fazer download:', error);
      alert('Erro ao fazer download do documento');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* Header */}
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Painel Administrativo</h1>
        <p className="text-gray-500">Gerencie o acesso das empresas e modere documentos.</p>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total de Empresas</p>
            <p className="text-2xl font-bold text-gray-900">{totalCompanies}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-orange-100 text-orange-600 rounded-lg">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Pendentes de Acesso</p>
            <p className="text-2xl font-bold text-gray-900">{pendingCompanies}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-lg">
            <UserCheck size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Cadastros Ativos</p>
            <p className="text-2xl font-bold text-gray-900">{activeCompanies}</p>
          </div>
        </div>
      </div>

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
              <th className="px-6 py-4">Responsável</th>
              <th className="px-6 py-4">Status do Cadastro</th>
              <th className="px-6 py-4">Docs Pendentes</th>
              <th className="px-6 py-4">Status Docs</th>
              <th colSpan={2} className="px-6 py-4 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredSuppliers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                  Nenhum fornecedor encontrado.
                </td>
              </tr>
            ) : (
              filteredSuppliers.map(({ company, responsible }) => {
                const docStats = getDocStats(String(company.id));
                return (
                  <tr key={company.id} className={`hover:bg-gray-50 transition-colors group ${company.status === CompanyStatus.PENDING ? 'bg-orange-50/30' : ''}`}>
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
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <UserIcon size={14} className="text-gray-400" />
                        {responsible ? responsible.name : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Badge status={company.status} context="company" />
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
                        onClick={() => setViewingCompany({ company, responsible })}
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

      {/* Modal: Document Details */}
      {selectedData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedSupplierId(null)} />

          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 zoom-in-95 duration-300">

            {/* Header */}
            <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-start">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-primary-600 shadow-sm">
                  <Building2 size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-gray-900">{selectedData.company.fantasyName}</h2>
                    <Badge status={selectedData.company.status} context="company" />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{selectedData.company.socialReason}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                    <span>CNPJ: {selectedData.company.cnpj}</span>
                    <span>•</span>
                    <span>{selectedData.company.city} - {selectedData.company.state}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedSupplierId(null)}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
              >
                <X size={24} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
              {selectedData.company.status === CompanyStatus.PENDING && (
                <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="text-orange-500" />
                    <div>
                      <h4 className="font-bold text-orange-800">Cadastro Pendente</h4>
                      <p className="text-sm text-orange-700">Esta empresa aguarda liberação para acessar o sistema.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleCompanyAuthorization(String(selectedData.company.id), CompanyStatus.ACTIVE)}
                    disabled={isUpdatingCompany}
                    className="px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {isUpdatingCompany ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
                    Autorizar Acesso
                  </button>
                </div>
              )}

              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">Documentação Enviada</h3>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3">Documento</th>
                      <th className="px-6 py-3">Enviado em</th>
                      <th className="px-6 py-3">Data Emissão</th>
                      <th className="px-6 py-3">Data Validade</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {selectedDocs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                          Nenhum documento enviado.
                        </td>
                      </tr>
                    ) : (
                      selectedDocs.map(doc => {
                        const validity = getValidityStatus(doc.dateExpiration);
                        return (
                          <tr key={doc.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2 font-medium text-gray-900">
                                <FileText size={16} className={doc.fileType === 'pdf' ? "text-red-500" : "text-blue-500"} />
                                {doc.name}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-gray-500">
                              {new Date(doc.uploadedAt).toLocaleDateString('pt-BR')}
                            </td>
                            <td className="px-6 py-4 text-gray-500">
                              {doc.dateIssue ? new Date(doc.dateIssue).toLocaleDateString('pt-BR') : '-'}
                            </td>
                            <td className="px-6 py-4 text-gray-500">
                              <div className="flex items-center gap-2">
                                <span>{doc.dateExpiration ? new Date(doc.dateExpiration).toLocaleDateString('pt-BR') : '-'}</span>
                                {validity === 'EXPIRED' && (
                                  <AlertCircle size={16} className="text-red-500" />
                                )}
                                {validity === 'ALERT' && (
                                  <AlertTriangle size={16} className="text-yellow-500" />
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <Badge status={doc.status} context="document" />
                                {doc.status === DocumentStatus.REJECTED && (
                                  <div className="text-red-500 cursor-help" title={doc.rejectionReason}>
                                    <AlertCircle size={16} />
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end items-center gap-2">
                                <button
                                  onClick={() => handleDownload(doc.id)}
                                  className="p-1.5 text-gray-500 hover:bg-gray-100 hover:text-primary-600 rounded-md transition-colors"
                                  title="Download"
                                >
                                  <Download size={18} />
                                </button>

                                {doc.status === DocumentStatus.PENDING && (
                                  <>
                                    <button
                                      onClick={() => handleApprove(doc)}
                                      disabled={isUpdatingDoc}
                                      className="p-1.5 text-green-600 hover:bg-green-50 rounded-md transition-colors"
                                      title="Aprovar"
                                    >
                                      <Check size={18} />
                                    </button>
                                    <button
                                      onClick={() => { setRejectingDoc(doc); setRejectionReason(''); }}
                                      disabled={isUpdatingDoc}
                                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                      title="Reprovar"
                                    >
                                      <X size={18} />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Rejection Reason Input */}
      {rejectingDoc && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/20 backdrop-blur-[2px] animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Reprovar Documento</h3>
            <p className="text-sm text-gray-500 mb-4">
              Justificativa para reprovar <strong>{rejectingDoc.name}</strong>:
            </p>
            <textarea
              className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none resize-none text-sm bg-gray-50"
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              placeholder="Descreva o motivo..."
              autoFocus
            />
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setRejectingDoc(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleRejectSubmit}
                disabled={!rejectionReason.trim() || isUpdatingDoc}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isUpdatingDoc && <Loader2 className="animate-spin" size={16} />}
                Confirmar Reprovação
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal: Company Details */}
      {viewingCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setViewingCompany(null)} />

          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 zoom-in-95 duration-300">

            {/* Header */}
            <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-start">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-primary-600 shadow-sm">
                  <Building2 size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-gray-900">{viewingCompany.company.fantasyName}</h2>
                    <Badge status={viewingCompany.company.status} context="company" />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Dados Cadastrais da Empresa</p>
                </div>
              </div>
              <button
                onClick={() => setViewingCompany(null)}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
              >
                <X size={24} />
              </button>
            </div>
            {/* Tabs */}
            <div className="px-6 border-b border-gray-100 flex gap-6">
              <button
                onClick={() => setActiveTab('info')}
                className={`py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'info' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                Dados Cadastrais
              </button>
              <button
                onClick={() => setActiveTab('requirements')}
                className={`py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'requirements' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                <ShieldCheck size={16} />
                Documentos Exigidos
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">

              {activeTab === 'info' ? (
                <>
                  {/* Identificação */}
                  <section>
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">Identificação</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <span className="text-xs text-gray-500 block">Razão Social</span>
                        <span className="text-sm font-medium text-gray-900">{viewingCompany.company.socialReason || '-'}</span>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <span className="text-xs text-gray-500 block">CNPJ</span>
                        <span className="text-sm font-medium text-gray-900">{viewingCompany.company.cnpj}</span>
                      </div>
                    </div>
                  </section>

                  {/* Contato */}
                  <section>
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">Contato</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <span className="text-xs text-gray-500 block">Telefone</span>
                        <span className="text-sm font-medium text-gray-900">{viewingCompany.company.phone || '-'}</span>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <span className="text-xs text-gray-500 block">Responsável</span>
                        <span className="text-sm font-medium text-gray-900">{viewingCompany.responsible?.name || '-'}</span>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg md:col-span-2">
                        <span className="text-xs text-gray-500 block">Email Responsável</span>
                        <span className="text-sm font-medium text-gray-900">{viewingCompany.responsible?.email || '-'}</span>
                      </div>
                    </div>
                  </section>

                  {/* Endereço */}
                  <section>
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">Endereço</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3 bg-gray-50 rounded-lg md:col-span-2">
                        <span className="text-xs text-gray-500 block">Logradouro</span>
                        <span className="text-sm font-medium text-gray-900">
                          {viewingCompany.company.address}, {viewingCompany.company.number}
                          {viewingCompany.company.complement && ` - ${viewingCompany.company.complement}`}
                        </span>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <span className="text-xs text-gray-500 block">Bairro</span>
                        <span className="text-sm font-medium text-gray-900">{viewingCompany.company.neighborhood || '-'}</span>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <span className="text-xs text-gray-500 block">CEP</span>
                        <span className="text-sm font-medium text-gray-900">{viewingCompany.company.zipCode || '-'}</span>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <span className="text-xs text-gray-500 block">Cidade</span>
                        <span className="text-sm font-medium text-gray-900">{viewingCompany.company.city || '-'}</span>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <span className="text-xs text-gray-500 block">Estado</span>
                        <span className="text-sm font-medium text-gray-900">{viewingCompany.company.state || '-'}</span>
                      </div>
                    </div>
                  </section>
                </>
              ) : (
                <div className="space-y-4 animate-in fade-in">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-blue-800 text-sm">
                    <p>Selecione os documentos que esta empresa <strong>deve</strong> enviar. O fornecedor será notificado sobre as pendências.</p>
                  </div>

                  {isLoadingRequirements ? (
                    <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary-600" /></div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2">
                      {documentTypes.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">Nenhum tipo de documento cadastrado no sistema.</div>
                      ) : (
                        documentTypes.map(type => (
                          <label key={type.id} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                            <input
                              type="checkbox"
                              className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500 border-gray-300 mr-3"
                              checked={companyRequirements.has(type.id)}
                              onChange={() => toggleRequirement(type.id)}
                            />
                            <span className="font-medium text-gray-700">{type.name}</span>
                          </label>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      )
      }
    </div >
  );
};