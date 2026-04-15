import { DollarSign, FileBarChart, FileSpreadsheet } from 'lucide-react';
import { UserRole } from '@/types';
import type { NavigationContext } from '../types';
import { HOME_ITEM } from '../shared';

export const faturamentoNavigation: NavigationContext = {
    basePath: '/faturamento',
    staticOnly: true,
    items: [
        HOME_ITEM,
        {
            label: 'Relatórios',
            icon: FileBarChart,
            path: '/faturamento',
            isGroup: true,
            children: [
                {
                    label: 'Cutoff',
                    icon: FileSpreadsheet,
                    path: '/faturamento/cutoff',
                    requiredPermissions: ['FAT_VIEW_CUTOFF'],
                },
                {
                    label: 'Faturamento Detalhado',
                    icon: FileBarChart,
                    path: '/faturamento/detalhado',
                    requiredPermissions: ['FAT_VIEW_DET'],
                },
            ],
        },
    ],
    allowedRoles: [UserRole.ADMIN, UserRole.EMPLOYEE],
};
