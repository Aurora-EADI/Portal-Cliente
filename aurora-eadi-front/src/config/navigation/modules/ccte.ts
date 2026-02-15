import { Plane } from 'lucide-react';
import { UserRole } from '@/types';
import { NavigationContext } from '../types';
import { HOME_ITEM, CLIENTE_ITEM } from '../shared';

export const ccteNavigation: NavigationContext = {
    basePath: '/ccte',
    items: [
        HOME_ITEM,
        {
            label: 'CCTE',
            icon: Plane,
            path: '/ccte',
        },
        // Adicionando clientes ao CCTE como solicitado
        CLIENTE_ITEM
    ],
    allowedRoles: [UserRole.ADMIN, UserRole.EMPLOYEE],
};
