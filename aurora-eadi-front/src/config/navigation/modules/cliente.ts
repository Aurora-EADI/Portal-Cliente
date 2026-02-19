import { List } from 'lucide-react';
import { UserRole } from '@/types';
import { NavigationContext } from '../types';
import { HOME_ITEM } from '../shared';

export const clienteNavigation: NavigationContext = {
    basePath: '/cliente',
    items: [
        HOME_ITEM,
        {
            label: 'Lista de Clientes',
            icon: List,
            path: '/cliente/lista',
            requiredPermissions: ['CAD_CLIENTE'],
        },
    ],
    allowedRoles: [UserRole.ADMIN, UserRole.EMPLOYEE],
};
