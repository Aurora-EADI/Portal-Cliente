import { Package, Kanban, ClipboardList } from 'lucide-react';
import { UserRole } from '@/types';
import { NavigationContext } from '../types';
import { HOME_ITEM } from '../shared';

export const dashboardNavigation: NavigationContext = {
    basePath: '/dashboard',
    items: [
        HOME_ITEM,
        {
            label: 'Armazém',
            icon: Package,
            path: '/dashboard/kanban',
            isGroup: true,
            children: [
                {
                    label: 'Kanban Containers',
                    icon: Kanban,
                    path: '/dashboard/kanban',
                },
                {
                    label: 'Conferencia de Carga',
                    icon: ClipboardList,
                    path: '/dashboard/conferencia-de-carga',
                },
            ],
        },
    ],
    allowedRoles: [UserRole.ADMIN, UserRole.EMPLOYEE],
};
