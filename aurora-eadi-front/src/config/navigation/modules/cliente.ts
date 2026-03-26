import { List } from 'lucide-react';
import { UserRole } from '@/types';
import type { NavigationContext } from '../types';
import { HOME_ITEM } from '../shared';

export const clienteNavigation: NavigationContext = {
    basePath: '/cliente',
    items: [
        HOME_ITEM,
        {
            label: 'Lista de Clientes',
            icon: List,
            path: '/cliente/lista',
        },
    ],
    allowedRoles: [UserRole.ADMIN, UserRole.EMPLOYEE],
};
