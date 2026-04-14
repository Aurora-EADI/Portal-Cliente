"use client"
import React, { useState } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { useDocuments, useUploadDocument } from '@/hooks/useDocuments';
import { DocumentStatus, DocumentType } from '@/types';
import { documentTypeService, supplierRequirementsService } from '@/services/api';
import { DocumentsPanel } from '@/components/pages/documentos/shared/DocumentsPanel';

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
  const target = new Date(baseDate.getFullYear(), baseDate.getMonth() + months, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(baseDate.getDate(), lastDay));
  return target;
}

function calculateExpirationDate(issueDate: string, periodicity: DocumentPeriodicity): string {
  const base = new Date(`${issueDate}T00:00:00`);
  if (Number.isNaN(base.getTime())) return '';

  let expiration = base;
  if (periodicity === 'Mensal') expiration = addMonths(base, 1);
  if (periodicity === 'Trimestral') expiration = addMonths(base, 3);
  if (periodicity === 'Semestral') expiration = addMonths(base, 6);
  if (periodicity === 'Anual') expiration = addMonths(base, 12);
  return expiration.toISOString().slice(0, 10);
}

export function SupplierDashboard() {
  const { currentUser } = useAuthContext();
  const { data: documents = [], isLoading: isLoadingDocs } = useDocuments(currentUser);
  const { mutate: upload, isPending: isUploading } = useUploadDocument();

  const [docName, setDocName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [dateIssue, setDateIssue] = useState('');
  const [dateExpiration, setDateExpiration] = useState('');
  const [selectedTypeId, setSelectedTypeId] = useState('');
  const [fileInputKey, setFileInputKey] = useState(0);

  const [requirements, setRequirements] = useState<
    { documentTypeId: number; isRequired: boolean; documentType?: DocumentType }[]
  >([]);
  const [isLoadingRequirements, setIsLoadingRequirements] = useState(true);

  React.useEffect(() => {
    loadRequirements();
  }, []);

  const companyDocumentTypes = React.useMemo(
    () => {
      const byId = new Map<number, { id: number; name: string; description?: string }>();
      requirements.forEach((req) => {
        byId.set(req.documentTypeId, {
          id: req.documentTypeId,
          name: req.documentType?.name?.trim() || `Documento #${req.documentTypeId}`,
          description: req.documentType?.description,
        });
      });
      return Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    },
    [requirements],
  );

  const selectedType = React.useMemo(
    () => companyDocumentTypes.find((item) => item.id === Number(selectedTypeId)),
    [companyDocumentTypes, selectedTypeId],
  );
  const companyTypeNameById = React.useMemo(() => {
    const map = new Map<number, string>();
    companyDocumentTypes.forEach((item) => map.set(item.id, item.name));
    return map;
  }, [companyDocumentTypes]);
  const selectedPeriodicity = React.useMemo<DocumentPeriodicity>(
    () => parsePeriodicity(selectedType?.description),
    [selectedType],
  );
  const requiresExpiration = selectedPeriodicity !== 'Sem periodicidade';

  const getDisplayDocumentName = (doc: any) => {
    const typeName =
      typeof doc.documentTypeId === 'number'
        ? companyTypeNameById.get(doc.documentTypeId)
        : undefined;

    if (typeName) {
      return typeName;
    }

    if (doc.name && doc.name.trim().toLowerCase() !== 'documento') {
      return doc.name;
    }

    return 'Documento sem tipo identificado';
  };

  const loadRequirements = async () => {
    try {
      setIsLoadingRequirements(true);
      const reqs = await supplierRequirementsService.getMyRequirements();
      let allTypes: DocumentType[] = [];
      try {
        allTypes = await documentTypeService.getAll();
      } catch (error) {
        console.warn('Nao foi possivel carregar tipos de documento para fallback:', error);
      }
      const allTypesById = new Map<number, DocumentType>();
      allTypes.forEach((type) => allTypesById.set(type.id, type));

      setRequirements(
        reqs.map((req) => ({
          ...req,
          documentType: req.documentType ?? allTypesById.get(req.documentTypeId),
        })),
      );
    } catch (error) {
      console.error('Erro ao carregar requisitos:', error);
      setRequirements([]);
    } finally {
      setIsLoadingRequirements(false);
    }
  };

  const pendingRequirements = requirements.filter((req) => {
    const hasDoc = documents.some(
      (d) => d.documentTypeId === req.documentTypeId && d.status !== DocumentStatus.REJECTED,
    );
    return req.isRequired && !hasDoc;
  });

  const handleSelectRequirement = (req: { documentTypeId: number; documentType?: DocumentType }) => {
    setSelectedTypeId(String(req.documentTypeId));
    setDocName(req.documentType?.name || companyTypeNameById.get(req.documentTypeId) || `Documento #${req.documentTypeId}`);
    const form = document.getElementById('upload-form');
    form?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !docName || !currentUser) return;
    if (requiresExpiration && !dateIssue) return;

    upload(
      {
        file,
        name: docName,
        user: currentUser,
        dateIssue,
        dateExpiration: requiresExpiration ? dateExpiration : '',
        documentTypeId: selectedTypeId || undefined,
      } as any,
      {
        onSuccess: () => {
          setFile(null);
          setDocName('');
          setDateIssue('');
          setDateExpiration('');
          setSelectedTypeId('');
          setFileInputKey((current) => current + 1);
        },
      },
    );
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


  return (
    <DocumentsPanel
      title="Meus Documentos"
      description="Envie e acompanhe o status dos documentos da sua empresa."
      pendingItems={pendingRequirements.map((req) => ({
        id: req.documentTypeId,
        name: req.documentType?.name || companyTypeNameById.get(req.documentTypeId) || 'Documento',
        onSelect: () => handleSelectRequirement(req),
      }))}
      pendingDescription="Sua empresa possui documentos obrigatorios pendentes de envio. Regularize sua situacao para evitar bloqueios."
      documentTypes={companyDocumentTypes}
      selectedTypeId={selectedTypeId}
      onSelectedTypeIdChange={(id) => {
        setSelectedTypeId(id);
        if (id) {
          const type = companyDocumentTypes.find((item) => item.id === Number(id));
          if (type) setDocName(type.name);
        } else {
          setDateExpiration('');
        }
      }}
      docName={docName}
      onDocNameChange={setDocName}
      dateIssue={dateIssue}
      onDateIssueChange={setDateIssue}
      dateExpiration={dateExpiration}
      onDateExpirationChange={setDateExpiration}
      requiresExpiration={requiresExpiration}
      file={file}
      fileInputKey={fileInputKey}
      onFileChange={setFile}
      onSubmit={handleUpload}
      isUploading={isUploading}
      isLoadingDocumentTypes={isLoadingRequirements}
      documents={documents}
      isLoadingDocuments={isLoadingDocs}
      emptyMessage="Nenhum documento enviado ainda."
      getDocumentTitle={getDisplayDocumentName}
      getDocumentSubtitle={(doc: any) => doc.name}
    />
  );
}
