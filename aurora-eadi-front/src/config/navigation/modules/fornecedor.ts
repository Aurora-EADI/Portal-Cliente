import { Truck } from 'lucide-react';
import { UserRole } from '@/types';
import { NavigationContext } from '../types';
import { HOME_ITEM } from '../shared';

export const fornecedorNavigation: NavigationContext = {
    basePath: '/fornecedor',
    items: [
        HOME_ITEM,
        {
            label: 'Fornecedores',
            icon: Truck,
            path: '/fornecedor',
            requiredPermissions: ['FOR_VIEW_LIST'],
        },
    ],
    allowedRoles: [UserRole.ADMIN, UserRole.EMPLOYEE],
};
