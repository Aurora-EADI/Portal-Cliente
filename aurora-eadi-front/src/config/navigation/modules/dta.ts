import { Ship, Package } from 'lucide-react';
import { UserRole } from '@/types';
import type { NavigationContext } from '../types';
import { HOME_ITEM, CLIENTE_ITEM } from '../shared';

export const dtaNavigation: NavigationContext = {
    basePath: '/dta',
    items: [
        HOME_ITEM,
        {
            label: 'DTA',
            icon: Package,
            path: '/dta',
            isGroup: true,
            children: [
                {
                    label: 'Processos Marítimos',
                    icon: Ship,
                    path: '/dta/maritimo',
                },
            ],
        },
        CLIENTE_ITEM,
    ],
    allowedRoles: [UserRole.ADMIN, UserRole.EMPLOYEE],
};
