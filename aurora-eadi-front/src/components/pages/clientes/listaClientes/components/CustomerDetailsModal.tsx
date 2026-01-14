import React from 'react';
import { Customer } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Building2, X } from 'lucide-react';

interface CustomerDetailsModalProps {
    customer: Customer;
    onClose: () => void;
}

export function CustomerDetailsModal({ customer, onClose }: CustomerDetailsModalProps) {
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 zoom-in-95 duration-300">

                {/* Header */}
                <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-start">
                    <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-primary-600 shadow-sm">
                            <Building2 size={24} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl font-bold text-gray-900">{customer.name}</h2>
                                <Badge status={customer.status} context="customer" />
                            </div>
                            <p className="text-sm text-gray-500 mt-1">Detalhes do Cliente</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Identificação */}
                    <section>
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">Identificação</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-3 bg-gray-50 rounded-lg">
                                <span className="text-xs text-gray-500 block">Código</span>
                                <span className="text-sm font-medium text-gray-900">{customer.code}</span>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-lg">
                                <span className="text-xs text-gray-500 block">Documento (CNPJ/CPF)</span>
                                <span className="text-sm font-medium text-gray-900">{customer.document}</span>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-lg md:col-span-2">
                                <span className="text-xs text-gray-500 block">Nome</span>
                                <span className="text-sm font-medium text-gray-900">{customer.name}</span>
                            </div>
                        </div>
                    </section>

                    {/* Datas */}
                    <section>
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">Informações do Sistema</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-3 bg-gray-50 rounded-lg">
                                <span className="text-xs text-gray-500 block">Criado em</span>
                                <span className="text-sm font-medium text-gray-900">{formatDate(customer.createdAt)}</span>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-lg">
                                <span className="text-xs text-gray-500 block">Atualizado em</span>
                                <span className="text-sm font-medium text-gray-900">{formatDate(customer.updatedAt)}</span>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
