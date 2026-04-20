import { Users, CalendarDays } from 'lucide-react';
import { UserRole } from '@/types';
import type { NavigationContext } from '../types';
import { HOME_ITEM } from '../shared';

export const recepcaoNavigation: NavigationContext = {
    basePath: '/recepcao',
    items: [
        HOME_ITEM,
        {
            label: 'Lista de Ramais',
            icon: Users,
            path: '/recepcao/contatos',
        },
        {
            label: 'Agenda',
            icon: CalendarDays,
            path: '/recepcao/agenda',
        },
    ],
    allowedRoles: [UserRole.ADMIN, UserRole.EMPLOYEE],
};
