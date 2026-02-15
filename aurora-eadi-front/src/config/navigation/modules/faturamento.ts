import { DollarSign, FileBarChart } from 'lucide-react';
import { UserRole } from '@/types';
import { NavigationContext } from '../types';
import { HOME_ITEM, CLIENTE_ITEM } from '../shared';

export const faturamentoNavigation: NavigationContext = {
    basePath: '/faturamento',
    items: [
        HOME_ITEM,
        {
            label: 'Faturamento',
            icon: DollarSign,
            path: '/faturamento',
            isGroup: true,
            children: [
                {
                    label: 'Faturamento Detalhado',
                    icon: FileBarChart,
                    path: '/faturamento',
                    requiredPermissions: ['FAT_VIEW_DET'],
                },
                {
                    label: 'Relatório CutOff',
                    icon: FileBarChart,
                    path: '/faturamento/cutoff',
                    requiredPermissions: ['FAT_VIEW_CUTOFF'],
                },
            ],
        },
        CLIENTE_ITEM,
    ],
    allowedRoles: [UserRole.ADMIN, UserRole.EMPLOYEE],
};
