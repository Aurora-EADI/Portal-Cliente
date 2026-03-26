import { List } from 'lucide-react';
import { UserRole } from '@/types';
import type { NavigationContext } from '../types';
import { HOME_ITEM } from '../shared';

export const fornecedorNavigation: NavigationContext = {
    basePath: '/fornecedor',
    items: [
        HOME_ITEM,
        {
            label: 'Lista de Fornecedores',
            icon: List,
            path: '/fornecedor/lista',
            requiredPermissions: ['FOR_VIEW_LIST'],
        },
    ],
    allowedRoles: [UserRole.ADMIN, UserRole.EMPLOYEE],
};
