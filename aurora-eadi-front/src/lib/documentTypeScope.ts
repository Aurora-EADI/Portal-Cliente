import { DocumentType } from '@/types';

export type DocumentTypeScope = 'COMPANY' | 'WORKFORCE';

const SCOPE_COMPANY_TOKEN = 'Escopo: Empresa';
const SCOPE_WORKFORCE_TOKEN = 'Escopo: Colaborador';

export function getDocumentTypeScopeFromDescription(
  description?: string,
): DocumentTypeScope {
  const raw = (description || '').toLowerCase();
  if (raw.includes('escopo: colaborador')) return 'WORKFORCE';
  if (raw.includes('escopo: empresa')) return 'COMPANY';
  return 'COMPANY';
}

export function getScopeToken(scope: DocumentTypeScope): string {
  return scope === 'WORKFORCE' ? SCOPE_WORKFORCE_TOKEN : SCOPE_COMPANY_TOKEN;
}

export function stripScopeToken(description?: string): string {
  return (description || '')
    .replace(/\s*\|\s*Escopo:\s*(Empresa|Colaborador)\s*/gi, ' ')
    .replace(/^\s*Escopo:\s*(Empresa|Colaborador)\s*\|\s*/gi, '')
    .replace(/^\s*Escopo:\s*(Empresa|Colaborador)\s*$/gi, '')
    .trim();
}

export function filterDocumentTypesByScope(
  types: DocumentType[],
  scope: DocumentTypeScope,
): DocumentType[] {
  return types.filter(
    (item) => getDocumentTypeScopeFromDescription(item.description) === scope,
  );
}

export function isWorkforceDocumentOptional(description?: string): boolean {
  const raw = (description || '').toLowerCase();
  return raw.includes('obrigatorio: nao');
}
