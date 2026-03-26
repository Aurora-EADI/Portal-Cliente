import { FileText, Shield, Upload, FilePlus, Users, UserPlus } from 'lucide-react';
import { UserRole } from '@/types';
import type { NavigationContext } from '../types';
import { HOME_ITEM } from '../shared';

export const documentosNavigation: NavigationContext = {
    basePath: '/documentos',
    staticOnly: true,
    items: [
        HOME_ITEM,
        {
            label: 'Documentos',
            icon: FileText,
            path: '/documentos',
            isGroup: true,
            children: [
                {
                    label: 'Gestão Documentos',
                    icon: Shield,
                    path: '/documentos/gestao',
                    requiredRoles: [UserRole.ADMIN, UserRole.EMPLOYEE],
                },
                {
                    label: 'Anexar Documentos',
                    icon: Upload,
                    path: '/documentos/empresa',
                    requiredRoles: [UserRole.SUPPLIER],
                },
                {
                    label: 'Documentos Exigidos',
                    icon: FilePlus,
                    path: '/documentos/cadastrar',
                    requiredRoles: [UserRole.ADMIN, UserRole.EMPLOYEE],
                },
                {
                    label: 'Colaboradores',
                    icon: Users,
                    path: '/documentos/colaboradores',
                    requiredRoles: [UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.SUPPLIER],
                },
                {
                    label: 'Docs Exigidos Colaboradores',
                    icon: UserPlus,
                    path: '/documentos/cadastrar-colaboradores',
                    requiredRoles: [UserRole.ADMIN, UserRole.EMPLOYEE],
                },
            ],
        },
    ],
    allowedRoles: [UserRole.ADMIN, UserRole.SUPPLIER, UserRole.EMPLOYEE],
};
