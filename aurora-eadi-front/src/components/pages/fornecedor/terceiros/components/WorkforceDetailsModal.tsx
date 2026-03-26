import React, { useMemo, useState } from 'react';
import { Download, Loader2, UploadCloud, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuthContext } from '@/context/AuthContext';
import { useUpdateWorkforceEmployee, useUpdateWorkforceStatus, useWorkforceDetails } from '@/hooks/useWorkforce';
import { useUploadWorkforceDocument, useWorkforceDocuments, useWorkforceMissingDocuments, useUpdateWorkforceDocumentStatus } from '@/hooks/useWorkforceDocuments';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ActionButton } from '@/components/ui/ActionButton';
import { RejectionReasonModal } from '@/components/pages/documentos/modals/RejectionReasonModal';
import { DocumentStatus, EmployeeStatus, UserRole } from '@/types';
import { formatCNPJ, formatCPF, formatDateBR } from '@/lib/utils';
import { toast } from 'sonner';
import { documentTypeService, workforceDocumentService } from '@/services/api';
import { filterDocumentTypesByScope } from '@/lib/documentTypeScope';

interface WorkforceDetailsModalProps {
  workforceId: string;
  onClose: () => void;
}

type DocumentPeriodicity =
  | 'Sem periodicidade'
  | 'Mensal'
  | 'Trimestral'
  | 'Semestral'
  | 'Anual';

function parsePeriodicity(description?: string): DocumentPeriodicity {
  const match = (description || '').match(/Periodicidade:\s*([^|]+)/i);
  const value = (match?.[1] || '').trim().toLowerCase();

  if (value === 'mensal') return 'Mensal';
  if (value === 'trimestral') return 'Trimestral';
  if (value === 'semestral') return 'Semestral';
  if (value === 'anual') return 'Anual';
  return 'Sem periodicidade';
}

function addMonths(baseDate: Date, months: number): Date {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const day = baseDate.getDate();

  const target = new Date(year, month + months, 1);
  const lastDayOfTargetMonth = new Date(
    target.getFullYear(),
    target.getMonth() + 1,
    0,
  ).getDate();
  target.setDate(Math.min(day, lastDayOfTargetMonth));
  return target;
}

function calculateExpirationDate(
  issueDate: string,
  periodicity: DocumentPeriodicity,
): string {
  const base = new Date(`${issueDate}T00:00:00`);
  if (Number.isNaN(base.getTime())) return '';

  let expiration = base;
  if (periodicity === 'Mensal') expiration = addMonths(base, 1);
  if (periodicity === 'Trimestral') expiration = addMonths(base, 3);
  if (periodicity === 'Semestral') expiration = addMonths(base, 6);
  if (periodicity === 'Anual') expiration = addMonths(base, 12);

  return expiration.toISOString().slice(0, 10);
}

function getDocumentStatusInfo(status: DocumentStatus, dateExpiration?: string) {
  if (status === DocumentStatus.PENDING) {
    return { variant: 'warning' as const, text: 'Pendente' };
  }
  if (status === DocumentStatus.REJECTED) {
    return { variant: 'danger' as const, text: 'Reprovado' };
  }
  if (status === DocumentStatus.APPROVED) {
    if (!dateExpiration) return { variant: 'success' as const, text: 'Aprovado' };
    
    const expiration = new Date(`${dateExpiration}T23:59:59`);
    const now = new Date();
    const diffTime = expiration.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { variant: 'danger' as const, text: 'Atrasado' };
    if (diffDays <= 7) return { variant: 'warning' as const, text: 'Aprovado' };
    return { variant: 'success' as const, text: 'Aprovado' };
  }
  return { variant: 'default' as const, text: status };
}

export function WorkforceDetailsModal({ workforceId, onClose }: WorkforceDetailsModalProps) {
  const { currentUser } = useAuthContext();
  const { data, isLoading } = useWorkforceDetails(workforceId);
  const { mutateAsync: updateEmployeeStatus, isPending } = useUpdateWorkforceStatus();
  const { mutateAsync: updateEmployee, isPending: isUpdatingEmployee } = useUpdateWorkforceEmployee();

  const { data: missing = [] } = useWorkforceMissingDocuments(workforceId);
  const { data: documents = [], isLoading: isLoadingDocuments } = useWorkforceDocuments(workforceId, false);
  const { mutateAsync: uploadDocument, isPending: isUploading } = useUploadWorkforceDocument();

  const { data: workforceDocumentTypes = [] } = useQuery({
    queryKey: ['workforce-document-types'],
    queryFn: async () => {
      const allTypes = await documentTypeService.getAll();
      return filterDocumentTypesByScope(allTypes, 'WORKFORCE')
        .filter((item) => item.active)
        .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    },
  });

  const { mutateAsync: updateDocumentStatus, isPending: isUpdatingStatus } = useUpdateWorkforceDocumentStatus();

  const [activeTab, setActiveTab] = useState<'info' | 'documents'>('info');
  const [isEditingData, setIsEditingData] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editCpf, setEditCpf] = useState('');
  const [editPosition, setEditPosition] = useState('');
  const [editHiredAt, setEditHiredAt] = useState('');
  const [selectedTypeId, setSelectedTypeId] = useState('');
  const [docName, setDocName] = useState('');
  const [dateIssue, setDateIssue] = useState('');
  const [dateExpiration, setDateExpiration] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [approvingDoc, setApprovingDoc] = useState<any | null>(null);
  const [rejectingDoc, setRejectingDoc] = useState<any | null>(null);
  const canUploadDocuments = currentUser?.role === UserRole.SUPPLIER;
  const canModerate = currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.EMPLOYEE;

  const documentTypeOptions = useMemo(
    () =>
      workforceDocumentTypes.map((item) => ({
        id: item.id,
        name: item.name,
        periodicity: parsePeriodicity(item.description),
      })),
    [workforceDocumentTypes],
  );
  const selectedPeriodicity: DocumentPeriodicity = useMemo(
    () =>
      documentTypeOptions.find((item) => item.id === Number(selectedTypeId))?.periodicity ||
      'Sem periodicidade',
    [documentTypeOptions, selectedTypeId],
  );
  const requiresExpiration = selectedPeriodicity !== 'Sem periodicidade';

  const toggleStatus = async () => {
    if (!data) return;
    const nextStatus =
      data.status === EmployeeStatus.ACTIVE ? EmployeeStatus.INACTIVE : EmployeeStatus.ACTIVE;
    await updateEmployeeStatus({ id: data.id, status: nextStatus });
  };

  const handleCpfChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    setEditCpf(formatCPF(digits));
  };

  const startEditingData = () => {
    if (!data) return;
    setEditFullName(data.fullName);
    setEditCpf(formatCPF(data.cpf));
    setEditPosition(data.position);
    setEditHiredAt(String(data.hiredAt).slice(0, 10));
    setIsEditingData(true);
  };

  const cancelEditingData = () => {
    setIsEditingData(false);
    setEditFullName('');
    setEditCpf('');
    setEditPosition('');
    setEditHiredAt('');
  };

  const resetForm = () => {
    setSelectedTypeId('');
    setDocName('');
    setDateIssue('');
    setDateExpiration('');
    setFile(null);
  };

  const handleSelectMissing = (item: { documentTypeId: number; documentType: { name: string } }) => {
    setSelectedTypeId(String(item.documentTypeId));
    setDocName(item.documentType.name);
  };

  React.useEffect(() => {
    if (!requiresExpiration) {
      setDateExpiration('');
      return;
    }

    if (!dateIssue) {
      setDateExpiration('');
      return;
    }

    setDateExpiration(calculateExpirationDate(dateIssue, selectedPeriodicity));
  }, [dateIssue, requiresExpiration, selectedPeriodicity]);

  const handleSaveEmployeeData = async () => {
    if (!data?.company?.id) {
      toast.error('Nao foi possivel identificar a empresa do colaborador.');
      return;
    }

    const cleanCpf = editCpf.replace(/\D/g, '');
    if (cleanCpf.length !== 11) {
      toast.error('Informe um CPF valido com 11 digitos.');
      return;
    }
    if (!editFullName.trim() || !editPosition.trim() || !editHiredAt) {
      toast.error('Preencha todos os campos obrigatorios do colaborador.');
      return;
    }

    try {
      await updateEmployee({
        companyId: data.company.id,
        employeeId: data.id,
        employee: {
          fullName: editFullName.trim(),
          cpf: cleanCpf,
          position: editPosition.trim(),
          hiredAt: editHiredAt,
          status: data.status,
        },
      });
      toast.success('Dados do colaborador atualizados com sucesso.');
      cancelEditingData();
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao atualizar dados do colaborador.');
    }
  };

  const handleDownload = async (id: string) => {
    try {
      const url = await workforceDocumentService.getDownloadUrl(id);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao baixar documento.');
    }
  };

  const handleUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file || !data || !docName.trim()) return;
    if (requiresExpiration && !dateIssue) {
      toast.error('Informe a data de emissao para calcular a validade automaticamente.');
      return;
    }

    try {
      await uploadDocument({
        file,
        companyEmployeeId: data.id,
        name: docName.trim(),
        dateIssue: dateIssue || undefined,
        dateExpiration: requiresExpiration ? dateExpiration || undefined : undefined,
        documentTypeId: selectedTypeId || undefined,
      });
      toast.success('Documento do colaborador enviado com sucesso.');
      resetForm();
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao enviar documento do colaborador.');
    }
  };

  const approveDocument = async (doc: any) => {
    try {
      await updateDocumentStatus({
        id: doc.id,
        status: DocumentStatus.APPROVED,
        employeeId: workforceId,
      });
      toast.success('Documento aprovado com sucesso.');
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao aprovar documento.');
    }
  };

  const rejectDocument = async (doc: any, reason: string) => {
    try {
      await updateDocumentStatus({
        id: doc.id,
        status: DocumentStatus.REJECTED,
        rejectionReason: reason,
        employeeId: workforceId,
      });
      toast.success('Documento reprovado com sucesso.');
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao reprovar documento.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900">Detalhes do Terceiro</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
            <X size={20} />
          </button>
        </div>

        {isLoading || !data ? (
          <div className="p-10 flex justify-center">
            <Loader2 className="animate-spin text-primary-600" />
          </div>
        ) : (
          <div className="p-6 space-y-5">
            <div className="border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('info')}
                  className={`px-3 py-2 text-sm rounded-lg ${activeTab === 'info' ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  Dados
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('documents')}
                  className={`px-3 py-2 text-sm rounded-lg ${activeTab === 'documents' ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  Documentos
                </button>
              </div>
            </div>

            {activeTab === 'info' ? (
              <>
                <div className="flex items-center gap-2">
                  <Badge variant={data.status === EmployeeStatus.ACTIVE ? 'success' : 'danger'}>
                    {data.status === EmployeeStatus.ACTIVE ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>

                {isEditingData ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Nome completo</label>
                      <input
                        type="text"
                        value={editFullName}
                        onChange={(event) => setEditFullName(event.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">CPF</label>
                      <input
                        type="text"
                        value={editCpf}
                        onChange={(event) => handleCpfChange(event.target.value)}
                        placeholder="000.000.000-00"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Funcao</label>
                      <input
                        type="text"
                        value={editPosition}
                        onChange={(event) => setEditPosition(event.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Admissao</label>
                      <input
                        type="date"
                        value={editHiredAt}
                        onChange={(event) => setEditHiredAt(event.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className="text-xs text-gray-500 block">Nome completo</span>
                      <span className="text-sm font-medium text-gray-900">{data.fullName}</span>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className="text-xs text-gray-500 block">CPF</span>
                      <span className="text-sm font-medium text-gray-900">{formatCPF(data.cpf)}</span>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className="text-xs text-gray-500 block">Funcao</span>
                      <span className="text-sm font-medium text-gray-900">{data.position}</span>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className="text-xs text-gray-500 block">Admissao</span>
                      <span className="text-sm font-medium text-gray-900">{formatDateBR(data.hiredAt)}</span>
                    </div>
                  </div>
                )}

                <div className="border-t pt-5">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Empresa</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className="text-xs text-gray-500 block">Nome fantasia</span>
                      <span className="text-sm font-medium text-gray-900">{data.company.fantasyName}</span>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className="text-xs text-gray-500 block">Razao social</span>
                      <span className="text-sm font-medium text-gray-900">{data.company.socialReason || '-'}</span>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className="text-xs text-gray-500 block">CNPJ</span>
                      <span className="text-sm font-medium text-gray-900">{data.company.cnpj ? formatCNPJ(data.company.cnpj) : '-'}</span>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className="text-xs text-gray-500 block">Telefone</span>
                      <span className="text-sm font-medium text-gray-900">{data.company.phone || '-'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  {isEditingData ? (
                    <>
                      <button
                        onClick={cancelEditingData}
                        disabled={isUpdatingEmployee}
                        className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleSaveEmployeeData}
                        disabled={isUpdatingEmployee}
                        className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50"
                      >
                        {isUpdatingEmployee ? 'Salvando...' : 'Salvar dados'}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={startEditingData}
                      className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      Editar dados
                    </button>
                  )}
                  <button
                    onClick={toggleStatus}
                    disabled={isPending}
                    className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50"
                  >
                    {isPending
                      ? 'Salvando...'
                      : data.status === EmployeeStatus.ACTIVE
                        ? 'Marcar como Inativo'
                        : 'Marcar como Ativo'}
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-5">
                {canUploadDocuments && missing.length > 0 && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <p className="text-sm font-semibold text-orange-800 mb-2">Documentos pendentes</p>
                    <div className="flex flex-wrap gap-2">
                      {missing.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelectMissing(item)}
                          className="px-3 py-1.5 rounded-md border border-orange-300 bg-white text-orange-800 text-xs font-medium hover:bg-orange-100"
                        >
                          {item.documentType.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {canUploadDocuments && (
                  <form onSubmit={handleUpload} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <UploadCloud className="text-primary-600" size={20} />
                      Novo Envio
                    </h2>

                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        <div className="md:col-span-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Documento</label>
                          <select
                            value={selectedTypeId}
                            onChange={(event) => {
                              const id = event.target.value;
                              setSelectedTypeId(id);
                              if (id) {
                                const selected = documentTypeOptions.find((item) => item.id === Number(id));
                                if (selected) setDocName(selected.name);
                              } else {
                                setDateExpiration('');
                              }
                            }}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white"
                            disabled={isUploading}
                          >
                            <option value="">Outro / Nao listado</option>
                            {documentTypeOptions.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="md:col-span-8">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Documento</label>
                          <input
                            type="text"
                            value={docName}
                            onChange={(event) => setDocName(event.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                            required
                            disabled={isUploading}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Data Emissao</label>
                          <input
                            type="date"
                            value={dateIssue}
                            onChange={(event) => setDateIssue(event.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                            disabled={isUploading}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Data Validade</label>
                          <input
                            type="date"
                            value={dateExpiration}
                            required={requiresExpiration}
                            readOnly
                            disabled
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            {requiresExpiration
                              ? `Validade calculada automaticamente (${selectedPeriodicity.toLowerCase()}).`
                              : 'Sem periodicidade: validade nao se aplica.'}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                        <div className="md:col-span-10">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Arquivo (PDF, JPG, PNG)</label>
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(event) => setFile(event.target.files?.[0] || null)}
                            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                            required
                            disabled={isUploading}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <button
                            type="submit"
                            disabled={isUploading || !file}
                            className="w-full py-2 px-4 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary-200/50 flex items-center justify-center"
                          >
                            {isUploading ? <Loader2 className="animate-spin" size={18} /> : 'Enviar'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </form>
                )}

                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-3 py-2 text-left">Documento</th>
                        <th className="px-3 py-2 text-left">Envio</th>
                        <th className="px-3 py-2 text-left">Validade</th>
                        <th className="px-3 py-2 text-left">Prazo</th>
                        <th className="px-3 py-2 text-right">Acoes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {isLoadingDocuments ? (
                        <tr>
                          <td colSpan={5} className="px-3 py-8 text-center text-gray-400">
                            <Loader2 className="animate-spin mx-auto" />
                          </td>
                        </tr>
                      ) : documents.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-3 py-8 text-center text-gray-400">
                            Nenhum documento enviado para este colaborador.
                          </td>
                        </tr>
                      ) : (
                        documents.map((doc) => (
                          <tr key={doc.id}>
                            <td className="px-3 py-2">
                              <p className="font-medium text-gray-900">{doc.name}</p>
                              {doc.documentType?.name && (
                                <p className="text-xs text-gray-500">{doc.documentType.name}</p>
                              )}
                            </td>
                            <td className="px-3 py-2 text-gray-600">{formatDateBR(doc.uploadedAt)}</td>
                            <td className="px-3 py-2 text-gray-600">{formatDateBR(doc.dateExpiration)}</td>
                            <td className="px-3 py-2">
                              <div className="flex flex-col gap-1">
                                {(() => {
                                  const { variant, text } = getDocumentStatusInfo(doc.status, doc.dateExpiration);
                                  return (
                                    <Badge variant={variant}>
                                      {text}
                                    </Badge>
                                  );
                                })()}
                                {doc.status === DocumentStatus.REJECTED && doc.rejectionReason && (
                                  <p className="text-[10px] text-red-600 font-medium">{doc.rejectionReason}</p>
                                )}
                              </div>
                            </td>
                            <td className="px-3 py-2 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {canModerate && doc.status === DocumentStatus.PENDING && (
                                  <>
                                    <ActionButton
                                      type="button"
                                      onClick={() => setRejectingDoc(doc)}
                                      disabled={isUpdatingStatus}
                                      variant="danger"
                                      size="sm"
                                    >
                                      Reprovar
                                    </ActionButton>
                                    <ActionButton
                                      type="button"
                                      onClick={() => setApprovingDoc(doc)}
                                      disabled={isUpdatingStatus}
                                      variant="success"
                                      size="sm"
                                    >
                                      Aprovar
                                    </ActionButton>
                                  </>
                                )}
                                <ActionButton
                                  type="button"
                                  onClick={() => handleDownload(doc.id)}
                                  variant="subtle"
                                  size="sm"
                                  icon={<Download size={14} />}
                                >
                                  Baixar
                                </ActionButton>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!approvingDoc}
        onOpenChange={(open) => !open && setApprovingDoc(null)}
        title="Aprovar Documento"
        description={`Deseja realmente aprovar o documento "${approvingDoc?.name || ''}"?`}
        confirmText="Aprovar"
        cancelText="Cancelar"
        variant="default"
        onConfirm={async () => {
          if (!approvingDoc) return;
          await approveDocument(approvingDoc);
          setApprovingDoc(null);
        }}
        isLoading={isUpdatingStatus}
      />

      <RejectionReasonModal
        open={!!rejectingDoc}
        onOpenChange={(open) => !open && setRejectingDoc(null)}
        document={rejectingDoc ? { name: rejectingDoc.name } : null}
        onConfirm={async (reason) => {
          if (!rejectingDoc) return;
          await rejectDocument(rejectingDoc, reason.trim());
          setRejectingDoc(null);
        }}
        isLoading={isUpdatingStatus}
      />
    </div>
  );
}
