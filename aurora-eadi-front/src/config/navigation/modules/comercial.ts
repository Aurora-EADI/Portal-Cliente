import { Ship, Plane, History as HistoryIcon, Wrench, Calculator } from 'lucide-react';
import { UserRole } from '@/types';
import type { NavigationContext } from '../types';
import { HOME_ITEM, CLIENTE_ITEM } from '../shared';

export const comercialNavigation: NavigationContext = {
    basePath: '/comercial',
    items: [
        HOME_ITEM,
        {
            label: 'Simulações',
            icon: Calculator,
            path: '/simulacoes',
            isGroup: true,
            children: [
                {
                    label: 'Simulador Marítimo',
                    icon: Ship,
                    path: '/comercial/simulador',
                },
                {
                    label: 'Simulação Aérea',
                    icon: Plane,
                    path: '/aereo/simulador',
                },
            ],
        },
        {
            label: 'Lista de simulação Marítima',
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
