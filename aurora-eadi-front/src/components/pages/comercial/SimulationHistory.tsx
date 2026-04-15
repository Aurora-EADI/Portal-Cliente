'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
    Search,
    ExternalLink,
    Calendar,
    User,
    FileText,
    Package,
    Plus,
    ArrowRight,
    History,
    CheckCircle,
    Send,
    XCircle,
    Clock,
    ChevronDown
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/Badge';
import { useSimulations, useChangeSimulationStatus } from '@/hooks/useSimulations';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatCurrency, formatDateBR, formatDocument } from '@/lib/utils';
import { SimulationStatus } from '@/types';
import { VersionHistoryModal } from './modals/VersionHistoryModal';
import { Pagination } from '@/components/ui/Pagination';

const statusConfig: Record<string, { label: string; color: string }> = {
    PENDING:       { label: 'Aguardando Definição', color: 'bg-slate-100 text-slate-600 border-slate-200' },
    DRAFT:         { label: 'Aguardando Definição', color: 'bg-slate-100 text-slate-600 border-slate-200' },
    IN_VALIDATION: { label: 'Aguardando Definição', color: 'bg-slate-100 text-slate-600 border-slate-200' },
    ACCEPTED:      { label: 'Aguardando Definição', color: 'bg-slate-100 text-slate-600 border-slate-200' },
    SENT:          { label: 'Enviada',              color: 'bg-blue-50 text-blue-700 border-blue-200' },
    APPROVED:      { label: 'Aprovada',             color: 'bg-green-50 text-green-700 border-green-200' },
    REJECTED:      { label: 'Rejeitada',            color: 'bg-red-50 text-red-700 border-red-200' },
};

export function SimulationHistory() {
    const router = useRouter();
    const { data: simulations, isLoading } = useSimulations();
    const changeStatusMutation = useChangeSimulationStatus();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSimNumber, setSelectedSimNumber] = useState<string | null>(null);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

    // Paginação
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    // Filtro local por cliente ou número
    const filteredSimulations = useMemo(() => {
        if (!simulations) return [];
        const term = searchTerm.toLowerCase();
        const filtered = simulations.filter(sim => {
            const currentVersion = sim.versions?.[0];
            return (
                sim.customer?.name.toLowerCase().includes(term) ||
                sim.customer?.document.includes(term) ||
                currentVersion?.displayNumber?.toLowerCase().includes(term) ||
                sim.simulationNumber.toLowerCase().includes(term)
            );
        });
        return filtered;
    }, [simulations, searchTerm]);

    // Resetar página ao buscar
    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const paginatedSimulations = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredSimulations.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredSimulations, currentPage]);

    const handleOpenHistory = (e: React.MouseEvent, simulationNumber: string) => {
        e.stopPropagation(); // Evita navegar para o simulador ao clicar no botão de histórico
        setSelectedSimNumber(simulationNumber);
        setIsHistoryModalOpen(true);
    };

    return (
        <div className="container mx-auto py-8 max-w-7xl animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                        Histórico de Cotações
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Gerencie e localize suas cotações salvas.
                    </p>
                </div>
                <Button
                    onClick={() => router.push('/comercial/simulador')}
                    className="bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-200 transition-all hover:scale-105"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Cotação
                </Button>
            </div>

            <Card className="border-none shadow-xl shadow-gray-200/50 bg-white/80 backdrop-blur-sm overflow-hidden">
                <CardHeader className="pb-0 pt-6">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <Input
                            placeholder="Buscar por cliente, documento ou número da cotação..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-12 h-12 bg-gray-50/50 border-gray-100 focus:bg-white transition-all text-lg"
                        />
                    </div>
                </CardHeader>

                <CardContent className="p-0 mt-6">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Cotação</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Cliente</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Geral</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Data</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Status</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Ação</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                                            Carregando cotações...
                                        </td>
                                    </tr>
                                ) : filteredSimulations.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                                            Nenhuma cotação encontrada.
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedSimulations.map((sim) => {
                                        const currentVersion = sim.versions?.[0];
                                        return (
                                            <tr
                                                key={sim.id}
                                                className="hover:bg-blue-50/30 transition-colors group cursor-pointer"
                                                onClick={() => router.push(`/comercial/simulador?id=${currentVersion?.id || sim.id}`)}
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-mono font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded text-sm w-fit border border-primary-100 flex items-center gap-1">
                                                            {currentVersion?.displayNumber || sim.simulationNumber}
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-5 w-5 p-0 hover:bg-primary-100 text-primary-500"
                                                                onClick={(e) => handleOpenHistory(e, sim.simulationNumber)}
                                                                title="Ver histórico de versões"
                                                            >
                                                                <History className="w-3 h-3" />
                                                            </Button>
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 shrink-0">
                                                            <User className="w-4 h-4" />
                                                        </div>
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="font-semibold text-gray-900 truncate">
                                                                {sim.customer?.name}
                                                            </span>
                                                            <span className="text-xs text-gray-500">
                                                                {formatDocument(sim.customer?.document || '')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-lg font-bold text-gray-900 italic">
                                                        {formatCurrency(currentVersion?.totalGeneral || 0)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col text-sm text-gray-600">
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                                            {formatDateBR(currentVersion?.createdAt || sim.createdAt)}
                                                        </span>
                                                        <span className="text-xs text-gray-400 ml-4">
                                                            às {new Date(currentVersion?.createdAt || sim.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {(() => {
                                                        const status = currentVersion?.status as string | undefined;
                                                        const cfg = status ? (statusConfig[status] ?? { label: status, color: 'bg-gray-100 text-gray-500 border-gray-200' }) : null;
                                                        return cfg ? (
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.color}`}>
                                                                {cfg.label}
                                                            </span>
                                                        ) : null;
                                                    })()}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        {currentVersion?.isCurrentVersion && (
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={(e) => e.stopPropagation()}
                                                                        className="gap-1.5 text-gray-700"
                                                                    >
                                                                        Definir Status
                                                                        <ChevronDown className="w-3.5 h-3.5" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                                                    <DropdownMenuLabel>Definir Status</DropdownMenuLabel>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem
                                                                        disabled={currentVersion?.status === SimulationStatus.PENDING || changeStatusMutation.isPending}
                                                                        onClick={() => changeStatusMutation.mutate({ id: currentVersion.id, status: SimulationStatus.PENDING })}
                                                                        className="gap-2"
                                                                    >
                                                                        <Clock className="w-4 h-4 text-slate-500" />
                                                                        Aguardando Definição
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        disabled={currentVersion?.status === SimulationStatus.SENT || changeStatusMutation.isPending}
                                                                        onClick={() => changeStatusMutation.mutate({ id: currentVersion.id, status: SimulationStatus.SENT })}
                                                                        className="gap-2"
                                                                    >
                                                                        <Send className="w-4 h-4 text-blue-500" />
                                                                        Enviada
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        disabled={currentVersion?.status === SimulationStatus.APPROVED || changeStatusMutation.isPending}
                                                                        onClick={() => changeStatusMutation.mutate({ id: currentVersion.id, status: SimulationStatus.APPROVED })}
                                                                        className="gap-2"
                                                                    >
                                                                        <CheckCircle className="w-4 h-4 text-green-600" />
                                                                        Aprovada
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        disabled={currentVersion?.status === SimulationStatus.REJECTED || changeStatusMutation.isPending}
                                                                        onClick={() => changeStatusMutation.mutate({ id: currentVersion.id, status: SimulationStatus.REJECTED })}
                                                                        className="gap-2 text-red-600 focus:text-red-600"
                                                                    >
                                                                        <XCircle className="w-4 h-4 text-red-500" />
                                                                        Rejeitada
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        )}
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-primary-600 hover:text-primary-700 hover:bg-primary-50 group-hover:translate-x-1 transition-all"
                                                        >
                                                            <ArrowRight className="w-5 h-5" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                    {filteredSimulations.length > itemsPerPage && (
                        <div className="p-4 border-t border-gray-100">
                            <Pagination
                                page={currentPage}
                                total={filteredSimulations.length}
                                limit={itemsPerPage}
                                onPageChange={setCurrentPage}
                            />
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="mt-6 flex items-center justify-between text-sm text-gray-500 px-2">
                <p>Mostrando {paginatedSimulations.length} de {filteredSimulations.length} resultados filtrados</p>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-normal border-gray-200">
                        Dica: Clique em qualquer linha para abrir no simulador
                    </Badge>
                </div>
            </div>

            {/* Modal de Histórico de Versões */}
            <VersionHistoryModal
                isOpen={isHistoryModalOpen}
                onClose={() => setIsHistoryModalOpen(false)}
                simulationNumber={selectedSimNumber || ''}
            />
        </div>
    );
}
