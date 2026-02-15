import { Wrench, Plus } from 'lucide-react';
import { UserRole } from '@/types';
import { NavigationContext } from '../types';
import { HOME_ITEM } from '../shared';

export const servicosNavigation: NavigationContext = {
    basePath: '/servicos',
    items: [
        HOME_ITEM,
        {
            label: 'Serviços',
            icon: Wrench,
            path: '/servicos',
        },
        {
            label: 'Cadastrar Serviço',
            icon: Plus,
            path: '/servicos/cadastro',
        },
    ],
    allowedRoles: [UserRole.ADMIN, UserRole.EMPLOYEE],
};
