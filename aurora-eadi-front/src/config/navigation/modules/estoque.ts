import { Package, LayoutDashboard, BarChart2 } from 'lucide-react';
import { UserRole } from '@/types';
import { NavigationContext } from '../types';
import { HOME_ITEM } from '../shared';

export const estoqueNavigation: NavigationContext = {
    basePath: '/estoque',
    items: [
        HOME_ITEM,
        {
            label: 'Estoque',
            icon: Package,
            path: '/estoque',
            isGroup: true,
            children: [
                {
                    label: 'Relatórios',
                    icon: BarChart2,
                    path: '/estoque',
                    isGroup: true,
                    children: [
                        {
                            label: 'Estoque em Processo',
                            icon: LayoutDashboard,
                            path: '/estoque/detalhado',
                        },
                    ],
                },
            ],
        },
    ],
    allowedRoles: [UserRole.ADMIN, UserRole.EMPLOYEE],
};
