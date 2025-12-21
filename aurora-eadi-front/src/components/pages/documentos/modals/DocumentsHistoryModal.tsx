'use client';

import React, { useState, useEffect } from 'react';
import { Document, DocumentStatus, Company } from '@/types';
import { FileText, X, Loader2, AlertCircle, Download } from 'lucide-react';

interface DocumentsHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: Company;
  documents: Document[];
  documentTypes: { id: number; name: string }[];
  requirements: {
    documentTypeId: number;
    documentType: { id: number; name: string };
    isRequired: boolean;
  }[];
  onApprove: (doc: Document) => void;
  onReject: (doc: Document) => void;
  onDownload: (docId: string) => void;
  isUpdating?: boolean;
  isLoadingRequirements?: boolean;
}

/**
 * Modal de visualização de documentos e histórico de uma empresa
 *
 * Layout de 2 painéis:
 * - Esquerda: Lista de documentos (Agrupados por Tipo)
 * - Direita: Histórico e ações do documento selecionado
 */
export function DocumentsHistoryModal({
  open,
  onOpenChange,
  company,
  documents,
  documentTypes,
  requirements,
  onApprove,
  onReject,
  onDownload,
  isUpdating = false,
  isLoadingRequirements = false,
}: DocumentsHistoryModalProps) {
  const [selectedGroupKey, setSelectedGroupKey] = useState<string | null>(null);

  // Função para gerar chave única do grupo
  const getGroupKey = (typeId: number, typeName: string, isNameGroup: boolean) => {
    return isNameGroup ? `name-${typeName}` : `type-${typeId}`;
  };

  // Group documents by type
  const groupedDocuments = React.useMemo(() => {
    // Separar documentos COM tipo e SEM tipo
    const docsWithType = documents.filter(d => d.documentTypeId);
    const docsWithoutType = documents.filter(d => !d.documentTypeId);

    // 1. Agrupar documentos COM tipo (comportamento normal)
    const typeGroups = new Map<number, Document[]>();
    docsWithType.forEach(doc => {
      const typeId = doc.documentTypeId!;
      if (!typeGroups.has(typeId)) {
        typeGroups.set(typeId, []);
      }
      typeGroups.get(typeId)?.push(doc);
    });

    // 2. Agrupar documentos SEM tipo por NOME (cada nome = grupo separado)
    const nameGroups = new Map<string, Document[]>();
    docsWithoutType.forEach(doc => {
      const docName = doc.name || 'Sem nome';
      if (!nameGroups.has(docName)) {
        nameGroups.set(docName, []);
      }
      nameGroups.get(docName)?.push(doc);
    });

    // 3. Converter grupos COM tipo
    const typedGroupsList = Array.from(typeGroups.entries()).map(([typeId, docs]) => {
      const sortedDocs = [...docs].sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
      const typeName = documentTypes.find(t => t.id === typeId)?.name || 'Documento';
      const isNameGroup = false;

      return {
        key: getGroupKey(typeId, typeName, isNameGroup),
        typeId,
        typeName,
        docs: sortedDocs,
        latestDoc: sortedDocs[0],
        isNameGroup
      };
    });

    // 4. Converter grupos SEM tipo (por nome)
    const nameGroupsList = Array.from(nameGroups.entries()).map(([docName, docs], index) => {
      const sortedDocs = [...docs].sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
      const isNameGroup = true;

      return {
        key: getGroupKey(-index - 1, docName, isNameGroup), // ID único para cada grupo sem tipo
        typeId: -index - 1,
        typeName: docName,
        docs: sortedDocs,
        latestDoc: sortedDocs[0],
        isNameGroup
      };
    });

    // 5. Combinar tudo: COM tipo primeiro, depois SEM tipo
    return [...typedGroupsList, ...nameGroupsList];
  }, [documents, documentTypes, getGroupKey]);

  // Auto-select first group when modal opens
  useEffect(() => {
    if (open && groupedDocuments.length > 0) {
      // Always select the first item when modal opens or documents change
      if (!selectedGroupKey || !groupedDocuments.find(g => g.key === selectedGroupKey)) {
        setSelectedGroupKey(groupedDocuments[0].key);
      }
    } else if (!open) {
      setSelectedGroupKey(null);
    }
  }, [open, groupedDocuments, selectedGroupKey]);

  // Get selected group
  const selectedGroup = selectedGroupKey
    ? groupedDocuments.find(g => g.key === selectedGroupKey)
    : null;

  // Get pending requirements (for the alert)
  const pendingRequirements = requirements.filter(req => {
    const hasApprovedDoc = documents.some(
      d => d.documentTypeId === req.documentTypeId && d.status === DocumentStatus.APPROVED
    );
    return !hasApprovedDoc;
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-background/80 backdrop-blur-sm">
      {/* Overlay clicável para fechar */}
      <div
        className="absolute inset-0"
        onClick={() => onOpenChange(false)}
      />

      <div className="relative bg-card w-full max-w-7xl h-[85vh] rounded-lg shadow-xl overflow-hidden flex flex-col border border-border">

        {/* HEADER - Always visible close button */}
        <div className="px-8 py-4 border-b border-border bg-muted/30 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-lg font-bold text-foreground">Documentos da Empresa</h2>
            <p className="text-sm text-muted-foreground">{company.fantasyName}</p>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="p-2 hover:bg-accent rounded-full transition-colors text-muted-foreground hover:text-foreground"
          >
            <X size={20} />
          </button>
        </div>

        {/* BODY - Two columns */}
        <div className="flex-1 flex overflow-hidden">
          {/* LEFT: Document Types List */}
          <div className="w-80 border-r border-border bg-muted/50 flex flex-col shrink-0">
          <div className="p-5 border-b border-border bg-card">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Lista de Itens
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {groupedDocuments.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <FileText size={48} />
                <p className="mt-4 text-xs font-semibold uppercase tracking-wide">Sem documentos</p>
              </div>
            ) : (
              groupedDocuments.map((group) => {
                const status = group.latestDoc.status;
                return (
                  <button
                    key={group.key}
                    onClick={() => setSelectedGroupKey(group.key)}
                    className={`w-full text-left px-4 py-3 rounded-md transition-all border ${selectedGroupKey === group.key
                      ? 'bg-primary text-primary-foreground border-primary shadow-md'
                      : 'bg-card border-transparent hover:bg-accent/50 hover:text-accent-foreground text-foreground'
                      }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-sm font-semibold truncate leading-tight flex-1 mr-2">
                        {group.typeName}
                      </p>
                      {/* Status indicator */}
                      {status === DocumentStatus.APPROVED && <div className={`w-2 h-2 rounded-full ${selectedGroupKey === group.key ? 'bg-white' : 'bg-green-500'}`} />}
                      {status === DocumentStatus.PENDING && <div className={`w-2 h-2 rounded-full animate-pulse ${selectedGroupKey === group.key ? 'bg-white' : 'bg-yellow-500'}`} />}
                      {status === DocumentStatus.REJECTED && <div className={`w-2 h-2 rounded-full ${selectedGroupKey === group.key ? 'bg-white' : 'bg-red-500'}`} />}
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className={selectedGroupKey === group.key ? 'text-primary-foreground/80' : 'text-muted-foreground'}>
                        {group.docs.length} versão(ões)
                      </span>
                      <span className={selectedGroupKey === group.key ? 'text-primary-foreground/80' : 'text-muted-foreground'}>
                        {new Date(group.latestDoc.uploadedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Pending Requirements Alert */}
          {!isLoadingRequirements && pendingRequirements.length > 0 && (
            <div className="p-4 border-t border-border bg-card">
              <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <AlertCircle className="text-yellow-600 dark:text-yellow-500 shrink-0" size={16} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-yellow-800 dark:text-yellow-300">
                    Documentos Pendentes
                  </p>
                  <ul className="mt-1 text-xs text-yellow-700 dark:text-yellow-400 space-y-0.5">
                    {pendingRequirements.slice(0, 3).map(req => (
                      <li key={req.documentTypeId} className="truncate">
                        • {req.documentType.name}
                      </li>
                    ))}
                    {pendingRequirements.length > 3 && (
                      <li className="font-medium">
                        +{pendingRequirements.length - 3} mais
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Document History */}
        <div className="flex-1 flex flex-col min-w-0 bg-card">
          {selectedGroup ? (
            <>
              <header className="px-8 py-6 border-b border-border shrink-0 bg-muted/10">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  {selectedGroup.typeName}
                  <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-muted text-muted-foreground border">
                    Exigido
                  </span>
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Histórico de versões e aprovações
                </p>
              </header>

              {/* History Table Header */}
              <div className="grid grid-cols-12 px-8 py-3 bg-muted/50 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wider shrink-0">
                <span className="col-span-2">Data Envio</span>
                <span className="col-span-2">Emissão</span>
                <span className="col-span-2">Validade</span>
                <span className="col-span-4">Status / Observação</span>
                <span className="col-span-2 text-right">Ações</span>
              </div>

              {/* History List Rows */}
              <div className="flex-1 overflow-y-auto divide-y divide-border">
                {selectedGroup.docs.map((doc, idx) => {
                  const isLatest = idx === 0;
                  const isRejected = doc.status === DocumentStatus.REJECTED;
                  const isApproved = doc.status === DocumentStatus.APPROVED;

                  return (
                    <div
                      key={doc.id}
                      className={`grid grid-cols-12 px-8 py-4 items-center transition-colors ${isLatest ? 'bg-primary/5' : 'hover:bg-muted/30 opacity-70'
                        }`}
                    >
                      <div className="col-span-2">
                        <div className="font-medium text-sm text-foreground">
                          {new Date(doc.uploadedAt).toLocaleDateString('pt-BR')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(doc.uploadedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>

                      <span className="col-span-2 text-sm text-muted-foreground">
                        {doc.dateIssue
                          ? new Date(doc.dateIssue).toLocaleDateString('pt-BR')
                          : '-'}
                      </span>

                      <span className="col-span-2 text-sm text-muted-foreground">
                        {doc.dateExpiration
                          ? new Date(doc.dateExpiration).toLocaleDateString('pt-BR')
                          : '-'}
                      </span>

                      <div className="col-span-4 pr-4">
                        <div className="flex items-center gap-2 mb-1">
                          {isApproved && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Aprovado</span>}
                          {isRejected && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">Reprovado</span>}
                          {doc.status === DocumentStatus.PENDING && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">Pendente</span>}
                        </div>

                        {(isRejected && doc.rejectionReason) && (
                          <p className="text-xs text-destructive dark:text-red-400 italic">
                            "{doc.rejectionReason}"
                          </p>
                        )}
                        {(!isRejected && !isApproved) && (
                          <p className="text-xs text-muted-foreground">Aguardando análise</p>
                        )}
                      </div>

                      <div className="col-span-2 text-right space-y-2">
                        {/* Action Buttons */}
                        {isLatest && doc.status === DocumentStatus.PENDING ? (
                          <div className="flex flex-col gap-2">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => onReject(doc)}
                                // disabled={isUpdating}
                                className="px-2 py-1 rounded-md border border-destructive text-destructive text-xs hover:bg-destructive/10 transition-colors"
                              >
                                Reprovar
                              </button>
                              <button
                                onClick={() => onApprove(doc)}
                                // disabled={isUpdating}
                                className="px-2 py-1 rounded-md bg-green-600 text-white text-xs hover:bg-green-700 shadow-sm transition-colors"
                              >
                                Aprovar
                              </button>
                            </div>
                            <button
                              onClick={() => onDownload(doc.id)}
                              className="text-xs text-primary hover:underline self-end"
                            >
                              Ver anexo
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => onDownload(doc.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors shadow-sm ml-auto"
                          >
                            <Download size={14} />
                            Download
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground h-full bg-muted/10">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <FileText size={32} className="opacity-50" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Detalhes do Documento</h3>
              <p className="max-w-xs text-center text-sm mt-1">
                Selecione um item da lista à esquerda para visualizar seu histórico e realizar aprovações.
              </p>
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}
