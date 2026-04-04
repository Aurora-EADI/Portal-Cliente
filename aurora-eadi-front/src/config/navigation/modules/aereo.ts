import { Plane, Ship, History as HistoryIcon, Wrench, Calculator, KanbanSquare } from 'lucide-react';
import { UserRole } from '@/types';
import type { NavigationContext } from '../types';
import { HOME_ITEM, CLIENTE_ITEM } from '../shared';

export const aereoNavigation: NavigationContext = {
    basePath: '/aereo',
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
                    label: 'Cotação Marítima',
                    icon: Ship,
                    path: '/comercial/simulador',
                },
                {
                    label: 'Cotação Aérea',
                    icon: Plane,
                    path: '/aereo/simulador',
                },
            ],
        },
        {
            label: 'Lista de Cotações Aéreas',
            icon: HistoryIcon,
            path: '/aereo/history',
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
