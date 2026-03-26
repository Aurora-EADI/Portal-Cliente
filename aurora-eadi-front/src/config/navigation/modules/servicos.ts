import { Wrench, Plus } from 'lucide-react';
import { UserRole } from '@/types';
import type { NavigationContext } from '../types';
import { HOME_ITEM } from '../shared';

export const servicosNavigation: NavigationContext = {
    basePath: '/servicos',
    items: [
        HOME_ITEM,
        {
            label: 'Lista de Serviços',
            icon: Wrench,
            path: '/servicos/lista',
        },
        {
            label: 'Cadastrar Serviço',
            icon: Plus,
            path: '/servicos/cadastro',
        },
    ],
    allowedRoles: [UserRole.ADMIN, UserRole.EMPLOYEE],
};
