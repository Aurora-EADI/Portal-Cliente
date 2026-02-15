import { UserRole } from '@/types';
import { NavigationContext } from '../types';
import { HOME_ITEM, CLIENTE_ITEM } from '../shared';

export const clienteNavigation: NavigationContext = {
    basePath: '/cliente',
    items: [
        HOME_ITEM,
        CLIENTE_ITEM,
    ],
    allowedRoles: [UserRole.ADMIN, UserRole.EMPLOYEE],
};
