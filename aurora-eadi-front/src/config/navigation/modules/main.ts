import { UserRole } from '@/types';
import type { NavigationContext } from '../types';
import { HOME_ITEM } from '../shared';

export const mainNavigation: NavigationContext = {
    basePath: '/modules',
    items: [
        HOME_ITEM,
    ],
    allowedRoles: [UserRole.ADMIN, UserRole.SUPPLIER, UserRole.EMPLOYEE],
};
