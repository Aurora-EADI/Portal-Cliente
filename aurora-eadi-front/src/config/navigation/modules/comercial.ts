import { Ship, Plane, History as HistoryIcon, Wrench, Calculator, KanbanSquare, BarChart2 } from 'lucide-react';
import { UserRole } from '@/types';
import type { NavigationContext } from '../types';
import { HOME_ITEM, CLIENTE_ITEM } from '../shared';

export const comercialNavigation: NavigationContext = {
    basePath: '/comercial',
    items: [
        HOME_ITEM,
        {
            label: 'Kanban Cotações',
            icon: KanbanSquare,
            path: '/comercial/kanban',
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
                    path: '/comercial/dashboard',
                },
                {
                    label: 'Cotação Marítima',
                    icon: Ship,
                    path: '/comercial/simulador',
                },
                {
                    label: 'Cotação Aérea',
                    icon: Plane,
                    path: '/aereo/simulador',
                },
                {
                    label: 'Lista de Cotações Marítimas',
                    icon: HistoryIcon,
                    path: '/comercial/history',
                },
                {
                    label: 'Lista de Cotações Aéreas',
                    icon: HistoryIcon,
                    path: '/aereo/history',
                },
            ],
        },
        {
            label: 'Serviços',
            icon: Wrench,
            path: '/servicos',
        },
        // Adicionando clientes ao Comercial como solicitado
        CLIENTE_ITEM,
    ],
    allowedRoles: [UserRole.ADMIN, UserRole.EMPLOYEE],
};
