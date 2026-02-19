import { Plane, LayoutDashboard } from 'lucide-react';
import { UserRole } from '@/types';
import { NavigationContext } from '../types';
import { HOME_ITEM, CLIENTE_ITEM } from '../shared';

export const dtaNavigation: NavigationContext = {
    basePath: '/dta',
    items: [
        HOME_ITEM,
        {
            label: 'Painel CT-e',
            icon: LayoutDashboard,
            path: '/dta/painel',
        },
        CLIENTE_ITEM
    ],
    allowedRoles: [UserRole.ADMIN, UserRole.EMPLOYEE],
};
