import { Container, ClipboardList } from 'lucide-react';
import { UserRole } from '@/types';
import { NavigationContext } from '../types';
import { HOME_ITEM } from '../shared';

export const inspecaoContainerNavigation: NavigationContext = {
    basePath: '/inspecao-container',
    items: [
        HOME_ITEM,
        {
            label: 'Inspeção Container',
            icon: Container,
            path: '/inspecao-container',
            isGroup: true,
            children: [
                {
                    label: 'Painel de Vistorias',
                    icon: ClipboardList,
                    path: '/inspecao-container/painel',
                },
            ],
        },
    ],
    allowedRoles: [UserRole.ADMIN, UserRole.EMPLOYEE],
};
