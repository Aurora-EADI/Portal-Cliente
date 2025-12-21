'use client';

import React, { useState } from 'react';
import { Company } from '@/types';
import { Building2, X, ShieldCheck, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

interface CompanyDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: Company | null;
  // Requirements tab data
  documentTypes?: { id: number; name: string }[];
  companyRequirements?: Set<number>;
  isLoadingRequirements?: boolean;
  // Callbacks
  onRequirementToggle?: (typeId: number) => void;
  onTabChange?: (tab: 'info' | 'requirements') => void;
}

/**
 * Modal de detalhes da empresa com sistema de tabs
 *
 * Tabs:
 * - Dados Cadastrais: Informações da empresa (estático)
 * - Documentos Exigidos: Requisitos de documentos (lazy loading)
 */
export function CompanyDetailsModal({
  open,
  onOpenChange,
  company,
  documentTypes = [],
  companyRequirements = new Set(),
  isLoadingRequirements = false,
  onRequirementToggle,
  onTabChange,
}: CompanyDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'requirements'>('info');

  const handleTabChange = (tab: 'info' | 'requirements') => {
    setActiveTab(tab);
    onTabChange?.(tab);
  };

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
        {/* Header */}
        <div className="p-6 border-b border-border bg-muted/50 flex justify-between items-start">
          <div className="flex gap-4">
            <div className="w-12 h-12 rounded-xl bg-card border border-border flex items-center justify-center text-primary-600 shadow-sm">
              <Building2 size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-foreground">
                  {company.fantasyName}
                </h2>
                <Badge status={company.status} context="company" />
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Dados Cadastrais da Empresa
              </p>
            </div>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="p-2 hover:bg-accent rounded-full transition-colors text-muted-foreground hover:text-foreground"
          >
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 border-b border-border flex gap-6">
          <button
            onClick={() => handleTabChange('info')}
            className={`py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'info'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Dados Cadastrais
          </button>
          <button
            onClick={() => handleTabChange('requirements')}
            className={`py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'requirements'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
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
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3">
                  Identificação
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <span className="text-xs text-muted-foreground block">
                      Razão Social
                    </span>
                    <span className="text-sm font-medium text-foreground">
                      {company.socialReason || '-'}
                    </span>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <span className="text-xs text-muted-foreground block">CNPJ</span>
                    <span className="text-sm font-medium text-foreground">
                      {company.cnpj}
                    </span>
                  </div>
                </div>
              </section>

              {/* Contato */}
              <section>
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3">
                  Contato
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <span className="text-xs text-muted-foreground block">
                      Telefone
                    </span>
                    <span className="text-sm font-medium text-foreground">
                      {company.phone || '-'}
                    </span>
                  </div>
                </div>
              </section>

              {/* Endereço */}
              <section>
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3">
                  Endereço
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-muted/50 rounded-lg md:col-span-2">
                    <span className="text-xs text-muted-foreground block">
                      Logradouro
                    </span>
                    <span className="text-sm font-medium text-foreground">
                      {company.address}, {company.number}
                      {company.complement && ` - ${company.complement}`}
                    </span>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <span className="text-xs text-muted-foreground block">Bairro</span>
                    <span className="text-sm font-medium text-foreground">
                      {company.neighborhood || '-'}
                    </span>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <span className="text-xs text-muted-foreground block">CEP</span>
                    <span className="text-sm font-medium text-foreground">
                      {company.zipCode || '-'}
                    </span>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <span className="text-xs text-muted-foreground block">Cidade</span>
                    <span className="text-sm font-medium text-foreground">
                      {company.city || '-'}
                    </span>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <span className="text-xs text-muted-foreground block">Estado</span>
                    <span className="text-sm font-medium text-foreground">
                      {company.state || '-'}
                    </span>
                  </div>
                </div>
              </section>
            </>
          ) : (
            <div className="space-y-4 animate-in fade-in">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800 text-blue-800 dark:text-blue-300 text-sm">
                <p>
                  Selecione os documentos que esta empresa <strong>deve</strong> enviar.
                  O fornecedor será notificado sobre as pendências.
                </p>
              </div>

              {isLoadingRequirements ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="animate-spin text-primary-600" />
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {documentTypes.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhum tipo de documento cadastrado no sistema.
                    </div>
                  ) : (
                    documentTypes.map(type => (
                      <label
                        key={type.id}
                        className="flex items-center p-3 border border-border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500 border-border mr-3"
                          checked={companyRequirements.has(type.id)}
                          onChange={() => onRequirementToggle?.(type.id)}
                        />
                        <span className="font-medium text-foreground">{type.name}</span>
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
  );
}
