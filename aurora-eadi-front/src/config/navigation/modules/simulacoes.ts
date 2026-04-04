import { Calculator, Ship, Plane, Wrench, BarChart2, ClipboardList, FileSearch, KanbanSquare } from 'lucide-react';
import { UserRole } from '@/types';
import type { NavigationContext } from '../types';
import { HOME_ITEM, CLIENTE_ITEM } from '../shared';

export const simulacoesNavigation: NavigationContext = {
    basePath: '/simulacoes',
    items: [
        HOME_ITEM,
        {
            label: 'Kanban Cotações',
            icon: KanbanSquare,
            path: '/simulacoes/propostas',
        },
        {
            label: 'Cotações',
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
                    label: 'Cotação Marítima',
                    icon: Ship,
                    path: '/simulacoes/maritimo',
                },
                {
                    label: 'Histórico Marítimo',
                    icon: ClipboardList,
                    path: '/simulacoes/historico-maritimo',
                },
                {
                    label: 'Cotação Aérea',
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
