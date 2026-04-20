import { ClipboardList, History, FileSearch } from 'lucide-react';
import { UserRole } from '@/types';
import type { NavigationContext } from '../types';
import { HOME_ITEM } from '../shared';

export const estoqueNavigation: NavigationContext = {
    basePath: '/estoque',
    staticOnly: true,
    items: [
        HOME_ITEM,
        {
            label: 'Relatórios',
            icon: ClipboardList,
            path: '/estoque',
            isGroup: true,
            children: [
                {
                    label: 'Histórico Lote',
                    icon: History,
                    path: '/estoque/historico-lote',
                },
                {
                    label: 'Inventário Simplificado',
                    icon: FileSearch,
                    path: '/estoque/inventario-simplificado',
                },
            ],
        },
    ],
    allowedRoles: [UserRole.ADMIN, UserRole.EMPLOYEE],
};
