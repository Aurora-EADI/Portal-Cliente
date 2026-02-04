import React from 'react';
import { Service, ServiceCalculationType } from '@/types';
import { useServiceCostCurrent } from '@/hooks/useServices';
import { X, Wrench, Calculator, FileText, Calendar, CheckCircle, XCircle, DollarSign } from 'lucide-react';

interface ServiceDetailsModalProps {
    service: Service;
    isOpen: boolean;
    onClose: () => void;
}

const calculationTypeLabels: Record<ServiceCalculationType, string> = {
    [ServiceCalculationType.FIXED]: 'Valor Fixo (R$)',
    [ServiceCalculationType.PERCENTAGE_CIF]: 'Percentual sobre CIF (%)',
    [ServiceCalculationType.PER_CONTAINER]: 'Valor por Container (R$)',
    [ServiceCalculationType.PER_TONNE]: 'Ton ou M³ (R$)',
    [ServiceCalculationType.PER_KG]: 'Por Quilo (R$)',
};

export function ServiceDetailsModal({ service, onClose }: ServiceDetailsModalProps) {
    const { data: costData } = useServiceCostCurrent(service.id);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatCost = (cost: number | undefined, calculationType: ServiceCalculationType) => {
        if (cost === undefined || cost === null) return '-';

        if (calculationType === ServiceCalculationType.PERCENTAGE_CIF) {
            return `${cost}%`;
        }
        return `R$ ${cost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
                            <Wrench size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Detalhes do Serviço</h3>
                            <p className="text-sm text-gray-500">{service.name}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                    {/* Status */}
                    <div className="flex items-center gap-2">
                        {service.isActive ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                <CheckCircle size={16} />
                                Ativo
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                                <XCircle size={16} />
                                Inativo
                            </span>
                        )}
                    </div>

                    {/* Informações Básicas */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                            Informações Básicas
                        </h4>

                        <div>
                            <p className="text-xs text-gray-500 mb-1">Nome</p>
                            <p className="text-sm font-medium text-gray-900">{service.name}</p>
                        </div>

                        {service.description && (
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Descrição</p>
                                <div className="flex items-start gap-2">
                                    <FileText size={14} className="text-gray-400 mt-0.5" />
                                    <p className="text-sm text-gray-700">{service.description}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Configuração de Cálculo */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                            Configuração de Cálculo
                        </h4>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Tipo de Cálculo</p>
                                <div className="flex items-center gap-2">
                                    <Calculator size={14} className="text-gray-400" />
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        {calculationTypeLabels[service.calculationType]}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <p className="text-xs text-gray-500 mb-1">TX / VALOR</p>
                                <div className="flex items-center gap-2">
                                    <DollarSign size={14} className="text-green-600" />
                                    <span className="text-sm font-semibold text-gray-900">
                                        {formatCost(costData?.cost, service.calculationType)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Datas */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                            Registro
                        </h4>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Criado em</p>
                                <div className="flex items-center gap-2">
                                    <Calendar size={14} className="text-gray-400" />
                                    <p className="text-sm text-gray-700">{formatDate(service.createdAt)}</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Atualizado em</p>
                                <div className="flex items-center gap-2">
                                    <Calendar size={14} className="text-gray-400" />
                                    <p className="text-sm text-gray-700">{formatDate(service.updatedAt)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end px-6 py-4 border-t border-gray-200 bg-gray-50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
}
