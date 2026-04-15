import { History as HistoryIcon, Wrench, Calculator, BarChart2, Users } from 'lucide-react';
import { UserRole } from '@/types';
import type { NavigationContext } from '../types';
import { HOME_ITEM } from '../shared';

export const comercialNavigation: NavigationContext = {
    basePath: '/comercial',
    staticOnly: true,
    items: [
        HOME_ITEM,
        {
            label: 'Cotações',
            icon: Calculator,
            path: '/simulacoes',
            isGroup: true,
            children: [
                {
                    label: 'Dashboard Cotações',
                    icon: BarChart2,
                    path: '/comercial/dashboard',
                },
                {
                    label: 'Gestão de Cotação Aérea',
                    icon: HistoryIcon,
                    path: '/aereo/history',
                },
                {
                    label: 'Gestão de Cotação Marítima',
                    icon: HistoryIcon,
                    path: '/comercial/history',
                },
            ],
        },
        {
            label: 'Gestão de Clientes',
            icon: Users,
            path: '/cliente',
        },
        {
            label: 'Gestão de Serviços',
            icon: Wrench,
            path: '/servicos',
        },
    ],
    allowedRoles: [UserRole.ADMIN, UserRole.EMPLOYEE],
};
