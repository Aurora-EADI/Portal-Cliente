import React, { useState, useMemo, useEffect } from 'react';
import { 
    useServices, 
    useRemoveService, 
    useServiceCostCurrent, 
    useActivateService 
} from "@/hooks/useServices";
import { Service, ServiceCalculationType, ServiceModal } from '@/types';
import { 
    Loader2, Wrench, Search, CheckCircle, XCircle, 
    Plus, FileText, DollarSign, Plane, Ship, Globe,
    Package
} from "lucide-react";
import { formatNumber } from '@/lib/utils';
import { ServiceDetailsModal } from './components/ServiceDetailsModal';
import { EditServiceModal } from './components/EditServiceModal';
import { UpdateCostModal } from './components/UpdateCostModal';
import { Edit, Pencil } from 'lucide-react';
import Link from 'next/link';
import { Pagination } from '@/components/ui/Pagination';

const calculationTypeLabels: Record<ServiceCalculationType, string> = {
    [ServiceCalculationType.FIXED]: 'Valor Fixo',
    [ServiceCalculationType.PERCENTAGE_CIF]: '% CIF',
    [ServiceCalculationType.PER_CONTAINER]: 'Por Container',
    [ServiceCalculationType.PER_TONNE]: 'Ton ou M³',
    [ServiceCalculationType.PER_KG]: 'Por Quilo',
};

const modalIcons: Record<string, React.ReactNode> = {
    AIR: <Plane size={14} className="text-blue-600" />,
    MARITIME: <Ship size={14} className="text-cyan-600" />,
    BOTH: <Globe size={14} className="text-purple-600" />,
};

const modalLabels: Record<string, string> = {
    AIR: 'Aéreo',
    MARITIME: 'Marítimo',
    BOTH: 'Ambos',
};

const modalColors: Record<string, string> = {
    AIR: 'bg-blue-100 text-blue-800 border-blue-200',
    MARITIME: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    BOTH: 'bg-purple-100 text-purple-800 border-purple-200',
};

export function ServiceList() {
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
    const [filterModal, setFilterModal] = useState<'all' | 'AIR' | 'MARITIME' | 'BOTH'>('all');
    const [searchInput, setSearchInput] = useState('');

    // Pagination constants
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const { data: services, isLoading, isError } = useServices(true, filterModal === 'all' ? undefined : filterModal as any);
    const { mutateAsync: removeService, isPending: isRemoving } = useRemoveService();
    const { mutateAsync: activateService, isPending: isActivating } = useActivateService();

    const [viewingService, setViewingService] = useState<Service | null>(null);
    const [editingService, setEditingService] = useState<Service | null>(null);
    const [updatingCostService, setUpdatingCostService] = useState<{ service: Service, cost?: number } | null>(null);

    const filteredServices = useMemo(() => {
        if (!services) return [];
        return services.filter(service => {
            const matchesSearch = service.name.toLowerCase().includes(searchInput.toLowerCase()) ||
                                 service.code.toLowerCase().includes(searchInput.toLowerCase());
            const matchesStatus = filterStatus === 'all' ? true :
                                 filterStatus === 'active' ? service.isActive : !service.isActive;
            return matchesSearch && matchesStatus;
        });
    }, [services, searchInput, filterStatus]);

    // Reset pagination on filter change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchInput, filterStatus, filterModal]);

    const paginatedServices = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredServices.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredServices, currentPage]);

    if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary-600" size={40} /></div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Serviços</h2>
                    <p className="text-sm text-gray-500">Gerencie os serviços e taxas do simulador</p>
                </div>
                <Link href="/servicos/cadastro" className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm">
                    <Plus size={20} /> Novo Serviço
                </Link>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por nome ou código..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                    />
                </div>
                <div className="flex flex-col md:flex-row gap-4">
                    <select 
                        value={filterModal}
                        onChange={(e) => setFilterModal(e.target.value as any)}
                        className="px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                    >
                        <option value="all">Todas as Modalidades</option>
                        <option value="AIR">Aéreo</option>
                        <option value="MARITIME">Marítimo</option>
                        <option value="BOTH">Ambos</option>
                    </select>
                    <select 
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as any)}
                        className="px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                    >
                        <option value="all">Todos os Status</option>
                        <option value="active">Apenas Ativos</option>
                        <option value="inactive">Apenas Inativos</option>
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200 text-sm">
                        <tr>
                            <th className="px-6 py-4">Nome</th>
                            <th className="px-6 py-4">Modalidade</th>
                            <th className="px-6 py-4">Tipo Cálculo</th>
                            <th className="px-6 py-4">TX / VALOR</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {paginatedServices.map(service => (
                            <TableRow 
                                key={service.id} 
                                service={service} 
                                onView={() => setViewingService(service)}
                                onEdit={() => setEditingService(service)}
                                onUpdateCost={(cost) => setUpdatingCostService({ service, cost })}
                                onToggleStatus={() => service.isActive ? removeService(service.id) : activateService(service.id)}
                                isUpdating={isRemoving || isActivating}
                            />
                        ))}
                    </tbody>
                </table>
            </div>

            {filteredServices.length > itemsPerPage && (
                <Pagination
                    page={currentPage}
                    total={filteredServices.length}
                    limit={itemsPerPage}
                    onPageChange={setCurrentPage}
                />
            )}

            {viewingService && (
                <ServiceDetailsModal 
                    service={viewingService} 
                    isOpen={!!viewingService} 
                    onClose={() => setViewingService(null)} 
                />
            )}

            {editingService && (
                <EditServiceModal
                    service={editingService}
                    isOpen={!!editingService}
                    onClose={() => setEditingService(null)}
                />
            )}

            {updatingCostService && (
                <UpdateCostModal
                    key={`cost-update-${updatingCostService.service.id}`}
                    service={updatingCostService.service}
                    currentCost={updatingCostService.cost}
                    isOpen={!!updatingCostService}
                    onClose={() => setUpdatingCostService(null)}
                />
            )}
        </div>
    );
}

function TableRow({ service, onView, onEdit, onUpdateCost, onToggleStatus, isUpdating }: {
    service: Service,
    onView: () => void,
    onEdit: () => void,
    onUpdateCost: (cost?: number) => void,
    onToggleStatus: () => void,
    isUpdating: boolean
}) {
    const { data: costData } = useServiceCostCurrent(service.id);

    const formatCost = (cost: number | undefined, calculationType: ServiceCalculationType) => {
        if (cost === undefined || cost === null) return '-';
        if (calculationType === ServiceCalculationType.PERCENTAGE_CIF) return `${cost}%`;
        return `R$ ${cost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    return (
        <tr className="hover:bg-gray-50 transition-colors text-sm">
            <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
                        <Wrench size={16} />
                    </div>
                    <div>
                        <div className="font-medium text-gray-900">{service.name}</div>
                        <div className="text-[10px] text-gray-400 font-mono uppercase tracking-tighter">{service.code}</div>
                    </div>
                </div>
            </td>

            <td className="px-6 py-4">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${modalColors[service.modal] || 'bg-gray-100 text-gray-800'}`}>
                    {modalIcons[service.modal]}
                    {modalLabels[service.modal] || service.modal}
                </span>
            </td>

            <td className="px-6 py-4">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-100">
                    {calculationTypeLabels[service.calculationType]}
                </span>
            </td>

            <td className="px-6 py-4">
                <div className="flex items-center gap-2 group">
                    <DollarSign size={14} className="text-green-600" />
                    <span className="font-semibold text-gray-900">
                        {formatCost(costData?.cost, service.calculationType)}
                    </span>
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            onUpdateCost(costData?.cost);
                        }}
                        className="p-1 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-all"
                        title="Atualizar Valor"
                    >
                        <Pencil size={14} />
                    </button>
                </div>
            </td>

            <td className="px-6 py-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium ${service.isActive
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                    }`}>
                    {service.isActive ? 'Ativo' : 'Inativo'}
                </span>
            </td>

            <td className="px-6 py-4">
                <div className="flex items-center justify-center gap-2">
                    <button onClick={onView} className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all" title="Ver Detalhes">
                        <FileText size={18} />
                    </button>
                    <button onClick={onEdit} className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all" title="Editar Serviço">
                        <Edit size={18} />
                    </button>
                    <button onClick={onToggleStatus} disabled={isUpdating} className={`p-2 rounded-lg transition-all ${service.isActive ? 'text-red-500 hover:bg-red-50' : 'text-green-500 hover:bg-green-50'}`} title={service.isActive ? 'Desativar' : 'Ativar'}>
                        {service.isActive ? <XCircle size={18} /> : <CheckCircle size={18} />}
                    </button>
                </div>
            </td>
        </tr>
    );
}