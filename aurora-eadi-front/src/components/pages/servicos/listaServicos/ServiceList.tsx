import React, { useState } from 'react';
import { 
    useServices, 
    useRemoveService, 
    useServiceCostCurrent, 
    useActivateService 
} from "@/hooks/useServices";
import { Service, ServiceCalculationType, ServiceModal } from '@/types';
import { 
    Loader2, Wrench, Search, CheckCircle, XCircle, 
    Plus, FileText, DollarSign, Plane, Ship, Globe 
} from "lucide-react";
import { formatNumber } from '@/lib/utils';
import { ServiceDetailsModal } from './components/ServiceDetailsModal';
import { EditServiceModal } from './components/EditServiceModal';
import { Edit } from 'lucide-react';
import Link from 'next/link';

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
    const [searchInput, setSearchInput] = useState('');

    const { data: services, isLoading, isError } = useServices(true);
    const { mutateAsync: removeService, isPending: isRemoving } = useRemoveService();
    const { mutateAsync: activateService, isPending: isActivating } = useActivateService();

    const [viewingService, setViewingService] = useState<Service | null>(null);
    const [editingService, setEditingService] = useState<Service | null>(null);

    const filteredServices = React.useMemo(() => {
        if (!services) return [];
        return services.filter(service => {
            const matchesSearch = service.name.toLowerCase().includes(searchInput.toLowerCase()) ||
                                 service.code.toLowerCase().includes(searchInput.toLowerCase());
            const matchesStatus = filterStatus === 'all' ? true :
                                 filterStatus === 'active' ? service.isActive : !service.isActive;
            return matchesSearch && matchesStatus;
        });
    }, [services, searchInput, filterStatus]);

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
                <select 
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500"
                >
                    <option value="all">Todos os Status</option>
                    <option value="active">Apenas Ativos</option>
                    <option value="inactive">Apenas Inativos</option>
                </select>
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
                        {filteredServices.map(service => (
                            <TableRow 
                                key={service.id} 
                                service={service} 
                                onView={() => setViewingService(service)}
                                onEdit={() => setEditingService(service)}
                                onToggleStatus={() => service.isActive ? removeService(service.id) : activateService(service.id)}
                                isUpdating={isRemoving || isActivating}
                            />
                        ))}
                    </tbody>
                </table>
            </div>

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
        </div>
    );
}

function TableRow({ service, onView, onEdit, onToggleStatus, isUpdating }: {
    service: Service,
    onView: () => void,
    onEdit: () => void,
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
                <div className="flex items-center gap-2">
                    <DollarSign size={14} className="text-green-600" />
                    <span className="font-semibold text-gray-900">
                        {formatCost(costData?.cost, service.calculationType)}
                    </span>
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