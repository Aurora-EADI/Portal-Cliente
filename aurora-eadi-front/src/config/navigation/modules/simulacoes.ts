import { Calculator, Ship, Plane, Wrench } from 'lucide-react';
import { UserRole } from '@/types';
import { NavigationContext } from '../types';
import { HOME_ITEM, CLIENTE_ITEM } from '../shared';

export const simulacoesNavigation: NavigationContext = {
    basePath: '/simulacoes',
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
                    path: '/comercial',
                },
                {
                    label: 'Simulação Aérea',
                    icon: Plane,
                    path: '/aereo',
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
