import React from 'react';
import { Building2, X } from 'lucide-react';
import { CompanyWithResponsible } from '@/services/api';
import { Badge } from '@/components/ui/Badge';
import { AllocationRegime } from '@/types';
import { formatCNPJ } from '@/lib/utils';

interface CompanyDetailsModalProps {
  companyData: CompanyWithResponsible;
  onClose: () => void;
}

function getAllocationRegimeLabel(regime?: AllocationRegime) {
  if (regime === AllocationRegime.FULL_WORKFORCE_AT_EADI) {
    return 'Com alocação de mão de obra no EADI';
  }
  if (regime === AllocationRegime.NO_WORKFORCE_AT_EADI) {
    return 'Sem alocação de mão de obra no EADI';
  }
  return '-';
}

export function CompanyDetailsModal({ companyData, onClose }: CompanyDetailsModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 zoom-in-95 duration-300">
        <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-start">
          <div className="flex gap-4">
            <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-primary-600 shadow-sm">
              <Building2 size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-gray-900">{companyData.company.fantasyName}</h2>
                <Badge status={companyData.company.status} context="company" />
              </div>
              <p className="text-sm text-gray-500 mt-1">Dados cadastrais do fornecedor (somente leitura)</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <section>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">Identificação</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <span className="text-xs text-gray-500 block">Razão Social</span>
                <span className="text-sm font-medium text-gray-900">{companyData.company.socialReason || '-'}</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <span className="text-xs text-gray-500 block">CNPJ</span>
                <span className="text-sm font-medium text-gray-900">{formatCNPJ(companyData.company.cnpj)}</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <span className="text-xs text-gray-500 block">Classificação empresarial</span>
                <span className="text-sm font-medium text-gray-900">{companyData.company.classification || '-'}</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <span className="text-xs text-gray-500 block">Regime de atuação</span>
                <span className="text-sm font-medium text-gray-900">
                  {getAllocationRegimeLabel(companyData.company.allocationRegime)}
                </span>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">Contato</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <span className="text-xs text-gray-500 block">Telefone</span>
                <span className="text-sm font-medium text-gray-900">{companyData.company.phone || '-'}</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <span className="text-xs text-gray-500 block">Responsável</span>
                <span className="text-sm font-medium text-gray-900">{companyData.responsible?.name || '-'}</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg md:col-span-2">
                <span className="text-xs text-gray-500 block">Email Responsável</span>
                <span className="text-sm font-medium text-gray-900">{companyData.responsible?.email || '-'}</span>
              </div>
            </div>
          </section>

          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
            A gestão de colaboradores terceirizados fica disponível na tela de <strong>Terceirizados</strong>.
          </div>
        </div>
      </div>
    </div>
  );
}
