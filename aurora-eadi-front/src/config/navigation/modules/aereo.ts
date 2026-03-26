import { Plane, Ship, History as HistoryIcon, Wrench, Calculator } from 'lucide-react';
import { UserRole } from '@/types';
import type { NavigationContext } from '../types';
import { HOME_ITEM, CLIENTE_ITEM } from '../shared';

export const aereoNavigation: NavigationContext = {
    basePath: '/aereo',
    items: [
        HOME_ITEM,
        {
            label: 'Simulações',
            icon: Calculator,
            path: '/simulacoes',
            isGroup: true,
            children: [
                {
                    label: 'Simulação Marítima',
                    icon: Ship,
                    path: '/comercial/simulador',
                },
                {
                    label: 'Simulador Aéreo',
                    icon: Plane,
                    path: '/aereo/simulador',
                },
            ],
        },
        {
            label: 'Lista de simulação Aérea',
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
