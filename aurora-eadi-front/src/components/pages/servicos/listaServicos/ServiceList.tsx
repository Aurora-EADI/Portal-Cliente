import React, { useState } from 'react';
import { useServices, useRemoveService, useServiceCostCurrent, useActivateService } from "@/hooks/useServices";
import { Service, ServiceCalculationType } from '@/types';
import { Loader2, Wrench, Search, CheckCircle, XCircle, Plus, FileText, DollarSign } from "lucide-react";
import { formatNumber } from '@/lib/utils';
import { ServiceDetailsModal } from './components/ServiceDetailsModal';
import Link from 'next/link';

const calculationTypeLabels: Record<ServiceCalculationType, string> = {
    [ServiceCalculationType.FIXED]: 'Valor Fixo',
    [ServiceCalculationType.PERCENTAGE_CIF]: '% CIF',
    [ServiceCalculationType.PER_CONTAINER]: 'Por Container',
    [ServiceCalculationType.PER_TONNE]: 'Por Tonelada',
};

export function ServiceList() {
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');

    const { data: services, isLoading, isError } = useServices(true);
    const { mutateAsync: removeService, isPending: isRemoving } = useRemoveService();
    const { mutateAsync: activateService, isPending: isActivating } = useActivateService();

    const [viewingService, setViewingService] = useState<Service | null>(null);

    const filteredServices = React.useMemo(() => {
        if (!services) return [];

        let result = services;

        // Filtro por status
        if (filterStatus === 'active') {
            result = result.filter(s => s.isActive);
        } else if (filterStatus === 'inactive') {
            result = result.filter(s => !s.isActive);
        }

        // Filtro por busca
        if (!search) return result;

        const searchLower = search.toLowerCase();
        return result.filter(service =>
            service.name.toLowerCase().includes(searchLower) ||
            (service.description?.toLowerCase().includes(searchLower))
        );
    }, [services, search, filterStatus]);

    const activeCount = services?.filter(s => s.isActive).length || 0;
    const inactiveCount = services?.filter(s => !s.isActive).length || 0;

    const handleToggleStatus = async (service: Service) => {
        try {
            if (service.isActive) {
                await removeService(service.id);
            } else {
                await activateService(service.id);
            }
        } catch (error) {
            console.error("Failed to update status", error);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setSearch(searchInput);
    };

    if (isLoading) {
        return (
            <div className="flex h-32 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="rounded-md bg-red-50 p-4 text-center text-red-600">
                Erro ao carregar serviços.
            </div>
        );
    }

    return (
        <div className="space-y-4 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-gray-900">Lista de Serviços</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Gerencie os serviços cadastrados para simulações.
                    </p>
                </div>
                <Link
                    href="/servicos/cadastro"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                >
                    <Plus size={20} />
                    Novo Serviço
                </Link>
            </div>

            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                    onClick={() => setFilterStatus('all')}
                    className={`bg-white p-6 rounded-xl border shadow-sm flex items-center gap-4 transition-all hover:shadow-md ${filterStatus === 'all'
                        ? 'border-primary-500 ring-2 ring-primary-200'
                        : 'border-gray-200'
                        }`}
                >
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                        <FileText size={16} />
                    </div>
                    <div className="text-left flex-1">
                        <p className="text-sm text-gray-500">Total</p>
                        <p className="text-xl font-bold text-gray-900">{formatNumber(activeCount + inactiveCount)}</p>
                    </div>
                    {filterStatus === 'all' && (
                        <CheckCircle size={20} className="text-primary-600" />
                    )}
                </button>

                <button
                    onClick={() => setFilterStatus('active')}
                    className={`bg-white p-6 rounded-xl border shadow-sm flex items-center gap-4 transition-all hover:shadow-md ${filterStatus === 'active'
                        ? 'border-primary-500 ring-2 ring-primary-200'
                        : 'border-gray-200'
                        }`}
                >
                    <div className="p-3 bg-green-100 text-green-600 rounded-lg">
                        <CheckCircle size={16} />
                    </div>
                    <div className="text-left flex-1">
                        <p className="text-sm text-gray-500">Ativos</p>
                        <p className="text-xl font-bold text-gray-900">{formatNumber(activeCount)}</p>
                    </div>
                    {filterStatus === 'active' && (
                        <CheckCircle size={20} className="text-primary-600" />
                    )}
                </button>

                <button
                    onClick={() => setFilterStatus('inactive')}
                    className={`bg-white p-6 rounded-xl border shadow-sm flex items-center gap-4 transition-all hover:shadow-md ${filterStatus === 'inactive'
                        ? 'border-primary-500 ring-2 ring-primary-200'
                        : 'border-gray-200'
                        }`}
                >
                    <div className="p-3 bg-red-100 text-red-600 rounded-lg">
                        <XCircle size={16} />
                    </div>
                    <div className="text-left flex-1">
                        <p className="text-sm text-gray-500">Inativos</p>
                        <p className="text-xl font-bold text-gray-900">{formatNumber(inactiveCount)}</p>
                    </div>
                    {filterStatus === 'inactive' && (
                        <CheckCircle size={20} className="text-primary-600" />
                    )}
                </button>
            </div>

            {/* Search */}
            <div className="space-y-3">
                <form onSubmit={handleSearch} className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nome ou descrição"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                    </div>
                    <button
                        type="submit"
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                    >
                        Buscar
                    </button>
                    {search && (
                        <button
                            type="button"
                            onClick={() => {
                                setSearch('');
                                setSearchInput('');
                            }}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                        >
                            Limpar
                        </button>
                    )}
                </form>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4">Nome</th>
                            <th className="px-6 py-4">Tipo Cálculo</th>
                            <th className="px-6 py-4">TX / VALOR</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredServices && filteredServices.length > 0 ? (
                            filteredServices.map((service) => (
                                <TableRow
                                    key={service.id}
                                    service={service}
                                    onView={() => setViewingService(service)}
                                    onToggleStatus={() => handleToggleStatus(service)}
                                    isUpdating={isRemoving || isActivating}
                                />
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                                    Nenhum serviço encontrado.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {viewingService && (
                <ServiceDetailsModal
                    service={viewingService}
                    onClose={() => setViewingService(null)}
                />
            )}
        </div>
    );
}

function TableRow({ service, onView, onToggleStatus, isUpdating }: {
    service: Service,
    onView: () => void,
    onToggleStatus: () => void,
    isUpdating: boolean
}) {
    const { data: costData } = useServiceCostCurrent(service.id);

    const formatCost = (cost: number | undefined, calculationType: ServiceCalculationType) => {
        if (cost === undefined || cost === null) return '-';

        if (calculationType === ServiceCalculationType.PERCENTAGE_CIF) {
            return `${cost}%`;
        }
        return `R$ ${cost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    return (
        <tr className="hover:bg-gray-50 transition-colors">
            <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
                        <Wrench size={20} />
                    </div>
                    <div>
                        <div className="font-medium text-gray-900">{service.name}</div>
                        {service.description && (
                            <div className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">
                                {service.description}
                            </div>
                        )}
                    </div>
                </div>
            </td>
            <td className="px-6 py-4">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {calculationTypeLabels[service.calculationType]}
                </span>
            </td>
            <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                    <DollarSign size={14} className="text-green-600" />
                    <span className="font-medium text-gray-900">
                        {formatCost(costData?.cost, service.calculationType)}
                    </span>
                </div>
            </td>
            <td className="px-6 py-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${service.isActive
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                    }`}>
                    {service.isActive ? 'Ativo' : 'Inativo'}
                </span>
            </td>
            <td className="px-6 py-4">
                <div className="flex items-center justify-center gap-2">
                    <button
                        onClick={onView}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 hover:border-primary-500 hover:text-primary-600 rounded-lg text-sm font-medium text-gray-700 transition-all shadow-sm"
                    >
                        <FileText size={16} />
                        Detalhes
                    </button>
                    <button
                        onClick={onToggleStatus}
                        disabled={isUpdating}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all shadow-sm ${service.isActive
                            ? 'bg-red-50 border border-red-200 text-red-600 hover:bg-red-100'
                            : 'bg-green-50 border border-green-200 text-green-600 hover:bg-green-100'
                            }`}
                    >
                        {service.isActive ? (
                            <>
                                <XCircle size={16} />
                                Desativar
                            </>
                        ) : (
                            <>
                                <CheckCircle size={16} />
                                Ativar
                            </>
                        )}
                    </button>
                </div>
            </td>
        </tr>
    );
}
