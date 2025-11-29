import React, { useState } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { useDocuments, useUploadDocument } from '@/hooks/useDocuments';
import { UploadCloud, FileText, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { DocumentStatus } from '@/types';

export function SupplierDashboard() {
  const { currentUser } = useAuthContext();
  const { data: documents = [], isLoading: isLoadingDocs } = useDocuments(currentUser);
  const { mutate: upload, isPending: isUploading } = useUploadDocument();

  const [docName, setDocName] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setFile(e.target.files[0]);
  };

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !docName || !currentUser) return;

    upload({ file, name: docName, user: currentUser }, {
      onSuccess: () => {
        setFile(null);
        setDocName('');
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

      {/* Upload Section */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <UploadCloud className="text-primary-600" size={20} />
          Novo Envio
        </h2>
        <form onSubmit={handleUpload} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-5">
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
          <div className="md:col-span-5">
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
                <th className="px-6 py-4">Data</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoadingDocs ? (
                 <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                       <div className="flex justify-center"><Loader2 className="animate-spin text-primary-500" /></div>
                    </td>
                 </tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                    Nenhum documento enviado ainda.
                  </td>
                </tr>
              ) : (
                documents.map(doc => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-2">
                      <FileText size={16} className={doc.fileType === 'pdf' ? "text-red-500" : "text-blue-500"} />
                      {doc.name}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(doc.uploadedAt).toLocaleDateString('pt-BR')}
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
    </div>
  );
};