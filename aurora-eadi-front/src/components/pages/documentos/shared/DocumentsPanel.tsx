"use client"

import React from 'react';
import { AlertCircle, CheckCircle, FileText, Loader2, UploadCloud, AlertTriangle } from 'lucide-react';

import { Badge } from '@/components/ui/Badge';
import { DocumentStatus } from '@/types';
import { formatDateBR } from '@/lib/utils';

export interface DocumentsPanelPendingItem {
  id: string | number;
  name: string;
  onSelect: () => void;
}

export interface DocumentsPanelDocument {
  id: string;
  name: string;
  fileType?: string;
  uploadedAt?: string;
  dateIssue?: string;
  dateExpiration?: string;
  status: DocumentStatus;
  rejectionReason?: string;
}

interface DocumentsPanelProps<TDocument extends DocumentsPanelDocument> {
  title: string;
  description: string;
  pendingItems?: DocumentsPanelPendingItem[];
  pendingTitle?: string;
  pendingDescription?: string;
  canUpload?: boolean;
  documentTypes: Array<{ id: string | number; name: string }>;
  selectedTypeId: string;
  onSelectedTypeIdChange: (id: string) => void;
  docName: string;
  onDocNameChange: (value: string) => void;
  dateIssue: string;
  onDateIssueChange: (value: string) => void;
  dateExpiration: string;
  onDateExpirationChange?: (value: string) => void;
  requiresExpiration: boolean;
  expirationHint?: string;
  file: File | null;
  fileInputKey?: string | number;
  onFileChange: (file: File | null) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  isUploading: boolean;
  isLoadingDocumentTypes?: boolean;
  documents: TDocument[];
  isLoadingDocuments: boolean;
  emptyMessage: string;
  getDocumentTitle: (doc: TDocument) => string;
  getDocumentSubtitle?: (doc: TDocument) => string | undefined;
  historyActionsLabel?: string;
  renderHistoryActions?: (doc: TDocument) => React.ReactNode;
  renderStatusContent?: (doc: TDocument) => React.ReactNode;
}

export function DocumentsPanel<TDocument extends DocumentsPanelDocument>({
  title,
  description,
  pendingItems = [],
  pendingTitle = 'Documentacao Pendente',
  pendingDescription = 'Existem documentos obrigatorios pendentes de envio. Regularize a situacao para evitar bloqueios.',
  canUpload = true,
  documentTypes,
  selectedTypeId,
  onSelectedTypeIdChange,
  docName,
  onDocNameChange,
  dateIssue,
  onDateIssueChange,
  dateExpiration,
  onDateExpirationChange,
  requiresExpiration,
  expirationHint,
  file,
  fileInputKey,
  onFileChange,
  onSubmit,
  isUploading,
  isLoadingDocumentTypes = false,
  documents,
  isLoadingDocuments,
  emptyMessage,
  getDocumentTitle,
  getDocumentSubtitle,
  historyActionsLabel = 'Detalhes',
  renderHistoryActions,
  renderStatusContent,
}: DocumentsPanelProps<TDocument>) {
  const fileInputId = React.useId();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <p className="text-gray-500">{description}</p>
      </header>

      {canUpload && pendingItems.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 animate-in slide-in-from-top-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-orange-100 rounded-lg text-orange-600 shrink-0">
              <AlertTriangle size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-orange-900 mb-2">{pendingTitle}</h3>
              <p className="text-sm text-orange-800 mb-4">{pendingDescription}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {pendingItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={item.onSelect}
                    className="flex items-center justify-between p-3 bg-white border border-orange-200 rounded-lg shadow-sm hover:border-orange-400 hover:shadow-md transition-all text-left group"
                  >
                    <span className="font-medium text-gray-700 group-hover:text-primary-600 truncate mr-2">
                      {item.name}
                    </span>
                    <UploadCloud size={16} className="text-gray-400 group-hover:text-primary-600 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {canUpload && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200" id="upload-form">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <UploadCloud className="text-primary-600" size={20} />
            Novo Envio
          </h2>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Documento</label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white"
                  value={selectedTypeId}
                  onChange={(event) => onSelectedTypeIdChange(event.target.value)}
                  disabled={isUploading || isLoadingDocumentTypes}
                >
                  <option value="">Outro / Nao listado</option>
                  {documentTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-8">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Documento</label>
                <input
                  type="text"
                  value={docName}
                  onChange={(event) => onDocNameChange(event.target.value)}
                  placeholder="Ex: Contrato Social"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  required
                  disabled={isUploading}
                />
              </div>
            </div>

            <div className={`grid grid-cols-1 gap-4 ${requiresExpiration ? 'md:grid-cols-2' : ''}`}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data Emissao</label>
                <input
                  type="date"
                  value={dateIssue}
                  onChange={(event) => onDateIssueChange(event.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  disabled={isUploading}
                />
              </div>
              {requiresExpiration && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data Validade</label>
                  <input
                    type="date"
                    value={dateExpiration}
                    onChange={(event) => onDateExpirationChange?.(event.target.value)}
                    required={requiresExpiration}
                    readOnly={!onDateExpirationChange}
                    disabled={isUploading}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                  {expirationHint && <p className="mt-1 text-xs text-gray-500">{expirationHint}</p>}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              <div className="md:col-span-10">
                <label className="block text-sm font-medium text-gray-700 mb-1">Arquivo (PDF, JPG, PNG)</label>
                <input
                  key={fileInputKey}
                  id={fileInputId}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(event) => onFileChange(event.target.files?.[0] || null)}
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
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">Historico</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200">
              <tr>
                <th className="px-6 py-4">Documento</th>
                <th className="px-6 py-4">Enviado em</th>
                <th className="px-6 py-4">Data Emissao</th>
                <th className="px-6 py-4">Data Validade</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">{historyActionsLabel}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoadingDocuments ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    <div className="flex justify-center">
                      <Loader2 className="animate-spin text-primary-500" />
                    </div>
                  </td>
                </tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-2">
                      <FileText size={16} className={doc.fileType === 'pdf' ? 'text-red-500' : 'text-blue-500'} />
                      <div className="min-w-0">
                        <p className="truncate">{getDocumentTitle(doc)}</p>
                        {getDocumentSubtitle?.(doc) && (
                          <p className="text-xs text-gray-500 truncate">{getDocumentSubtitle(doc)}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{formatDateBR(doc.uploadedAt)}</td>
                    <td className="px-6 py-4 text-gray-500">{formatDateBR(doc.dateIssue)}</td>
                    <td className="px-6 py-4 text-gray-500">{formatDateBR(doc.dateExpiration)}</td>
                    <td className="px-6 py-4">
                      {renderStatusContent ? (
                        renderStatusContent(doc)
                      ) : (
                        <div className="flex flex-col gap-1 items-start">
                          <Badge status={doc.status} context="document" />
                          {doc.status === DocumentStatus.REJECTED && doc.rejectionReason && (
                            <div className="group relative flex items-center gap-1 text-red-600 cursor-help mt-1">
                              <AlertCircle size={16} />
                              <span className="text-xs font-medium">Ver Motivo</span>
                              <div className="absolute bottom-full right-0 mb-2 w-64 p-3 bg-white rounded-lg shadow-xl border border-red-100 text-xs text-gray-700 hidden group-hover:block z-10">
                                <strong>Motivo:</strong> {doc.rejectionReason}
                              </div>
                            </div>
                          )}
                          {doc.status === DocumentStatus.APPROVED && (
                            <span className="text-green-600 flex items-center gap-1 text-xs font-medium mt-1">
                              <CheckCircle size={16} /> Aprovado
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">{renderHistoryActions?.(doc)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
