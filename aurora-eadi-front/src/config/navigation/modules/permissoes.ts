import { Settings, Database, Layers, Users, ShieldCheck, LayoutGrid } from 'lucide-react';
import { UserRole } from '@/types';
import type { NavigationContext } from '../types';
import { HOME_ITEM } from '../shared';

export const permissoesNavigation: NavigationContext = {
    basePath: '/permissoes',
    staticOnly: true,
    items: [
        HOME_ITEM,
        {
            label: 'Configurações',
            icon: Settings,
            path: '/permissoes',
            isGroup: true,
            children: [
                {
                    label: 'Gestão de Funcionalidade',
                    icon: Database,
                    path: '/permissoes/catalogo',
                },
                {
                    label: 'Gestão de Módulos',
                    icon: LayoutGrid,
                    path: '/permissoes',
                },
                {
                    label: 'Gestão de Perfis',
                    icon: ShieldCheck,
                    path: '/permissoes/gestao',
                },
                {
                    label: 'Gestão de Usuário',
                    icon: Users,
                    path: '/permissoes/usuario',
                },
                {
                    label: 'Módulo x Funcionalidade',
                    icon: Layers,
                    path: '/permissoes/atividades',
                },
            ],
        },
    ],
    allowedRoles: [UserRole.ADMIN],
};
