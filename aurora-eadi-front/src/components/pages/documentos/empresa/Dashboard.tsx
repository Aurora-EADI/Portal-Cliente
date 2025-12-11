"use client"
import React, { useState } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { useDocuments, useUploadDocument } from '@/hooks/useDocuments';
import { UploadCloud, FileText, AlertCircle, CheckCircle, Loader2, AlertTriangle, Check } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { DocumentStatus, DocumentType } from '@/types';
import { supplierRequirementsService, documentTypeService } from '@/services/api';
import { Header } from '@/components/layout/Header';

export function SupplierDashboard() {
  const { currentUser } = useAuthContext();
  const { data: documents = [], isLoading: isLoadingDocs } = useDocuments(currentUser);
  const { mutate: upload, isPending: isUploading } = useUploadDocument();

  const [docName, setDocName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [dateIssue, setDateIssue] = useState('');
  const [dateExpiration, setDateExpiration] = useState('');
  const [selectedTypeId, setSelectedTypeId] = useState('');

  // Requirements State
  const [requirements, setRequirements] = useState<{ documentTypeId: number; isRequired: boolean; documentType: DocumentType }[]>([]);
  const [isLoadingRequirements, setIsLoadingRequirements] = useState(true);

  React.useEffect(() => {
    loadRequirements();
  }, []);

  const loadRequirements = async () => {
    try {
      setIsLoadingRequirements(true);
      const reqs = await supplierRequirementsService.getMyRequirements();
      setRequirements(reqs);
    } catch (error) {
      console.error('Erro ao carregar requisitos:', error);
    } finally {
      setIsLoadingRequirements(false);
    }
  };

  const pendingRequirements = requirements.filter(req => {
    // Check if we have an approved or pending document for this type
    const hasDoc = documents.some(d => d.documentTypeId === req.documentTypeId && d.status !== DocumentStatus.REJECTED);
    return req.isRequired && !hasDoc;
  });

  const handleSelectRequirement = (req: { documentTypeId: number, documentType: DocumentType }) => {
    setSelectedTypeId(String(req.documentTypeId));
    setDocName(req.documentType.name);
    // Construct anchor scroll if needed or just focus form
    const form = document.getElementById('upload-form');
    form?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setFile(e.target.files[0]);
  };



  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !docName || !currentUser) return;

    upload({
      file,
      name: docName,
      user: currentUser,
      dateIssue,
      dateExpiration,
      documentTypeId: selectedTypeId || undefined
    } as any, { // Cast to any if hook types aren't updated yet
      onSuccess: () => {
        setFile(null);
        setDocName('');
        setDateIssue('');
        setDateExpiration('');
        setSelectedTypeId('');
        const input = document.getElementById('file-upload') as HTMLInputElement;
        if (input) input.value = '';
      }
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Meus Documentos</h1>
        <p className="text-gray-500">Envie e acompanhe o status dos documentos da sua empresa.</p>
      </header>

      {/* Requirements Alert Section */}
      {
        pendingRequirements.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 animate-in slide-in-from-top-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-orange-100 rounded-lg text-orange-600 shrink-0">
                <AlertTriangle size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-orange-900 mb-2">Documentação Pendente</h3>
                <p className="text-sm text-orange-800 mb-4">
                  Sua empresa possui documentos obrigatórios pendentes de envio. Regularize sua situação para evitar bloqueios.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {pendingRequirements.map(req => (
                    <button
                      key={req.documentTypeId}
                      onClick={() => handleSelectRequirement(req)}
                      className="flex items-center justify-between p-3 bg-white border border-orange-200 rounded-lg shadow-sm hover:border-orange-400 hover:shadow-md transition-all text-left group"
                    >
                      <span className="font-medium text-gray-700 group-hover:text-primary-600">{req.documentType.name}</span>
                      <UploadCloud size={16} className="text-gray-400 group-hover:text-primary-600" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Upload Section */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200" id="upload-form">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <UploadCloud className="text-primary-600" size={20} />
          Novo Envio
        </h2>
        <form onSubmit={handleUpload} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Documento</label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white"
                value={selectedTypeId}
                onChange={(e) => {
                  const id = e.target.value;
                  setSelectedTypeId(id);
                  if (id) {
                    const type = requirements.find(r => r.documentTypeId === Number(id));
                    if (type) setDocName(type.documentType.name);
                  }
                }}
                disabled={isUploading}
              >
                <option value="">Outro / Não listado</option>
                {requirements.map(req => (
                  <option key={req.documentTypeId} value={req.documentTypeId}>
                    {req.documentType.name} {req.isRequired ? '(Obrigatório)' : '(Opcional)'}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-8">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Documento</label>
              <input
                type="text"
                value={docName}
                onChange={e => setDocName(e.target.value)}
                placeholder="Ex: Contrato Social"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                required
                disabled={isUploading}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Emissão</label>
              <input
                type="date"
                value={dateIssue}
                onChange={e => setDateIssue(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                disabled={isUploading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Validade</label>
              <input
                type="date"
                value={dateExpiration}
                onChange={e => setDateExpiration(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                disabled={isUploading}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <div className="md:col-span-10">
              <label className="block text-sm font-medium text-gray-700 mb-1">Arquivo (PDF, JPG, PNG)</label>
              <input
                id="file-upload"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
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
        </form>
      </div>

      {/* List Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">Histórico</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200">
              <tr>
                <th className="px-6 py-4">Documento</th>
                <th className="px-6 py-4">Enviado em</th>
                <th className="px-6 py-4">Data Emissão</th>
                <th className="px-6 py-4">Data Validade</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoadingDocs ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    <div className="flex justify-center"><Loader2 className="animate-spin text-primary-500" /></div>
                  </td>
                </tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    Nenhum documento enviado ainda.
                  </td>
                </tr>
              ) : (
                documents.map((doc: any) => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-2">
                      <FileText size={16} className={doc.fileType === 'pdf' ? "text-red-500" : "text-blue-500"} />
                      {doc.name}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(doc.uploadedAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {doc.dateIssue ? new Date(doc.dateIssue).toLocaleDateString('pt-BR') : '-'}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {doc.dateExpiration ? new Date(doc.dateExpiration).toLocaleDateString('pt-BR') : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <Badge status={doc.status} context="document" />
                    </td>
                    <td className="px-6 py-4">
                      {doc.status === DocumentStatus.REJECTED && (
                        <div className="group relative flex items-center gap-1 text-red-600 cursor-help">
                          <AlertCircle size={16} />
                          <span className="text-xs font-medium">Ver Motivo</span>
                          <div className="absolute bottom-full right-0 mb-2 w-64 p-3 bg-white rounded-lg shadow-xl border border-red-100 text-xs text-gray-700 hidden group-hover:block z-10">
                            <strong>Motivo:</strong> {doc.rejectionReason}
                          </div>
                        </div>
                      )}
                      {doc.status === DocumentStatus.APPROVED && (
                        <span className="text-green-600 flex items-center gap-1 text-xs font-medium">
                          <CheckCircle size={16} /> Aprovado
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div >
  );
};