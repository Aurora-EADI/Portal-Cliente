import { Ship, Plane, History as HistoryIcon, Wrench, Calculator, KanbanSquare } from 'lucide-react';
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
            label: 'Lista de Cotações Marítimas',
            icon: HistoryIcon,
            path: '/comercial/history',
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
