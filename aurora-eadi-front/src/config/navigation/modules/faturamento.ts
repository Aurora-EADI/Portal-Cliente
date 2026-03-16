import { DollarSign, FileBarChart, FileSpreadsheet } from 'lucide-react';
import { UserRole } from '@/types';
import { NavigationContext } from '../types';
import { HOME_ITEM } from '../shared';

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
                    path: '/faturamento/detalhado',
                    requiredPermissions: ['FAT_VIEW_DET'],
                },
                {
                    label: 'Relatório CutOff',
                    icon: FileSpreadsheet,
                    path: '/faturamento/cutoff',
                    requiredPermissions: ['FAT_VIEW_CUTOFF'],
                },
            ],
        },
    ],
    allowedRoles: [UserRole.ADMIN, UserRole.EMPLOYEE],
};
