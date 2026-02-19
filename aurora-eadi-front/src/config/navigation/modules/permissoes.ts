import { Shield, FileText, ListChecks, UserPlus, ShieldCheck } from 'lucide-react';
import { UserRole } from '@/types';
import { NavigationContext } from '../types';
import { HOME_ITEM } from '../shared';

export const permissoesNavigation: NavigationContext = {
    basePath: '/permissoes',
    items: [
        HOME_ITEM,
        {
            label: 'Permissões',
            icon: Shield,
            path: '/permissoes',
            isGroup: true,
            children: [
                {
                    label: 'Módulos',
                    icon: FileText,
                    path: '/permissoes',
                },
                {
                    label: 'Catalogo técnico ',
                    icon: FileText,
                    path: '/permissoes/catalogo',
                },
                {
                    label: 'Atividades e Vinculos',
                    icon: ListChecks,
                    path: '/permissoes/atividades',
                },
                {
                    label: 'Usuário',
                    icon: UserPlus,
                    path: '/permissoes/usuario',
                },
                {
                    label: 'Gestão de Permissões',
                    icon: ShieldCheck,
                    path: '/permissoes/gestao',
                },
            ],
        },
    ],
    allowedRoles: [UserRole.ADMIN],
};
