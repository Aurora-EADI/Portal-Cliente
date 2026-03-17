import { Calculator, Ship, Plane, Wrench, BarChart2, ClipboardList, FileSearch, KanbanSquare } from 'lucide-react';
import { UserRole } from '@/types';
import { NavigationContext } from '../types';
import { HOME_ITEM, CLIENTE_ITEM } from '../shared';

export const simulacoesNavigation: NavigationContext = {
    basePath: '/simulacoes',
    items: [
        HOME_ITEM,
        {
            label: 'Propostas',
            icon: KanbanSquare,
            path: '/simulacoes/propostas',
        },
        {
            label: 'Simulações',
            icon: Calculator,
            path: '/simulacoes',
            isGroup: true,
            children: [
                {
                    label: 'Dashboard',
                    icon: BarChart2,
                    path: '/simulacoes/dashboard',
                },
                {
                    label: 'Simulação Marítima',
                    icon: Ship,
                    path: '/simulacoes/maritimo',
                },
                {
                    label: 'Histórico Marítimo',
                    icon: ClipboardList,
                    path: '/simulacoes/historico-maritimo',
                },
                {
                    label: 'Simulação Aérea',
                    icon: Plane,
                    path: '/simulacoes/aereo',
                },
                {
                    label: 'Histórico Aéreo',
                    icon: FileSearch,
                    path: '/simulacoes/historico-aereo',
                },
            ],
        },
        {
            label: 'Serviços',
            icon: Wrench,
            path: '/servicos',
        },
        CLIENTE_ITEM,
    ],
    allowedRoles: [UserRole.ADMIN, UserRole.EMPLOYEE],
};
