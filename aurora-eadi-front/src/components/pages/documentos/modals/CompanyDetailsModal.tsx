'use client';

import React from 'react';
import { Company } from '@/types';
import { Building2, X } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { formatCNPJ } from '@/lib/utils';

interface CompanyDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: Company | null;
  requirements?: {
    documentTypeId: number;
    documentType: { id: number; name: string };
    isRequired: boolean;
  }[];
  workforceRequirements?: {
    documentTypeId: number;
    documentType: { id: number; name: string };
    isRequired: boolean;
  }[];
  allDocumentTypes?: { id: number; name: string }[];
  isLoadingRequirements?: boolean;
  isLoadingWorkforceRequirements?: boolean;
  onTabChange?: (tab: 'info' | 'requirements' | 'workforceRequirements') => void;
  onSaveWorkforceRequirements?: (
    requirements: { documentTypeId: number; isRequired: boolean }[],
  ) => Promise<void> | void;
}

export function CompanyDetailsModal({
  open,
  onOpenChange,
  company,
}: CompanyDetailsModalProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onOpenChange(false);
    }
  };

  if (!open || !company) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />

      <div
        className="relative bg-card rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 zoom-in-95 duration-300"
        onKeyDown={handleKeyDown}
      >
        <div className="p-6 border-b border-border bg-muted/50 flex justify-between items-start">
          <div className="flex gap-4">
            <div className="w-12 h-12 rounded-xl bg-card border border-border flex items-center justify-center text-primary-600 shadow-sm">
              <Building2 size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-foreground">{company.fantasyName}</h2>
                <Badge status={company.status} context="company" />
              </div>
              <p className="text-sm text-muted-foreground mt-1">Dados Cadastrais da Empresa</p>
            </div>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="p-2 hover:bg-accent rounded-full transition-colors text-muted-foreground hover:text-foreground"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <section>
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3">
              Identificação
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-muted/50 rounded-lg">
                <span className="text-xs text-muted-foreground block">Razão Social</span>
                <span className="text-sm font-medium text-foreground">{company.socialReason || '-'}</span>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <span className="text-xs text-muted-foreground block">CNPJ</span>
                <span className="text-sm font-medium text-foreground">{formatCNPJ(company.cnpj)}</span>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3">
              Contato
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-muted/50 rounded-lg">
                <span className="text-xs text-muted-foreground block">Telefone</span>
                <span className="text-sm font-medium text-foreground">{company.phone || '-'}</span>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3">
              Endereço
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-muted/50 rounded-lg md:col-span-2">
                <span className="text-xs text-muted-foreground block">Logradouro</span>
                <span className="text-sm font-medium text-foreground">
                  {company.address}, {company.number}
                  {company.complement && ` - ${company.complement}`}
                </span>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <span className="text-xs text-muted-foreground block">Bairro</span>
                <span className="text-sm font-medium text-foreground">{company.neighborhood || '-'}</span>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <span className="text-xs text-muted-foreground block">CEP</span>
                <span className="text-sm font-medium text-foreground">{company.zipCode || '-'}</span>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <span className="text-xs text-muted-foreground block">Cidade</span>
                <span className="text-sm font-medium text-foreground">{company.city || '-'}</span>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <span className="text-xs text-muted-foreground block">Estado</span>
                <span className="text-sm font-medium text-foreground">{company.state || '-'}</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
