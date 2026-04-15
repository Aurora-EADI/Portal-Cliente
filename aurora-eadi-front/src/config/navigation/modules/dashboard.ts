import { Package, Kanban, ClipboardList } from 'lucide-react';
import { UserRole } from '@/types';
import type { NavigationContext } from '../types';
import { HOME_ITEM } from '../shared';

export const dashboardNavigation: NavigationContext = {
    basePath: '/dashboard',
    staticOnly: true,
    items: [
        HOME_ITEM,
        {
            label: 'Armazém',
            icon: Package,
            path: '/dashboard/kanban',
            isGroup: true,
            children: [
                {
                    label: 'Transito no Recinto',
                    icon: Kanban,
                    path: '/dashboard/kanban',
                },
                {
                    label: 'Conferência de Carga',
                    icon: ClipboardList,
                    path: '/dashboard/conferencia-de-carga',
                },
            ],
        },
    ],
    allowedRoles: [UserRole.ADMIN, UserRole.EMPLOYEE],
};
