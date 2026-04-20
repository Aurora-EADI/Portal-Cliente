'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/Badge';
import { Calendar, User, ExternalLink, History } from 'lucide-react';
import { useAirSimulationVersionHistory } from '@/hooks/useAirSimulations';
import { formatCurrency, formatDateBR } from '@/lib/utils';
import { AirSimulation } from '@/types/air-simulation';

interface AirVersionHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    simulationNumber: string;
}

export function AirVersionHistoryModal({
    isOpen,
    onClose,
    simulationNumber,
}: AirVersionHistoryModalProps) {
    const router = useRouter();
    const { data: versions, isLoading } = useAirSimulationVersionHistory(simulationNumber);

    const handleOpenVersion = (id: string) => {
        router.push(`/aereo/simulador?id=${id}`);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <History className="w-6 h-6 text-primary-600" />
                        Histórico de Versões: {simulationNumber}
                    </DialogTitle>
                    <DialogDescription>
                        Visualize e acesse todas as versões criadas para esta cotação aérea.
                    </DialogDescription>
                </DialogHeader>

                <div className="mt-4 overflow-y-auto flex-1">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-gray-50/50">
                                <TableHead className="w-[120px]">Versão</TableHead>
                                <TableHead>Data de Criação</TableHead>
                                <TableHead>Responsável</TableHead>
                                <TableHead>Total Geral</TableHead>
                                <TableHead>Motivo</TableHead>
                                <TableHead className="text-center w-[100px]">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center text-gray-500">
                                        Carregando histórico...
                                    </TableCell>
                                </TableRow>
                            ) : !versions || versions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center text-gray-500">
                                        Nenhuma versão encontrada.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                versions.map((version: AirSimulation) => (
                                    <TableRow key={version.id} className="hover:bg-gray-50/50 transition-colors">
                                        <TableCell>
                                            <Badge variant={version.isCurrentVersion ? 'default' : 'secondary'} className="font-mono">
                                                {version.displayNumber.split('-').pop()}
                                                {version.isCurrentVersion && ' (Atual)'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            <div className="flex flex-col">
                                                <span className="flex items-center gap-1 font-medium">
                                                    <Calendar className="w-3 h-3 text-gray-400" />
                                                    {formatDateBR(version.createdAt)}
                                                </span>
                                                <span className="text-xs text-gray-400 pl-4">
                                                    {new Date(version.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            <div className="flex items-center gap-2">
                                                <User className="w-3 h-3 text-gray-400" />
                                                {version.user?.name || 'Sistema'}
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-bold text-gray-900">
                                            {formatCurrency(version.totalGeneral || 0)}
                                        </TableCell>
                                        <TableCell className="text-sm text-gray-500 max-w-[200px] truncate">
                                            {version.versionReason || '-'}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => handleOpenVersion(version.id)}
                                                className="text-primary-600 hover:text-primary-700 hover:bg-primary-50"
                                                title="Abrir esta versão"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </DialogContent>
        </Dialog>
    );
}
