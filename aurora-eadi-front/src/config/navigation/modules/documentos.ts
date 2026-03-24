import { FileText, Shield, Upload, FilePlus, Users, UserCheck, UserPlus, FileCheck } from 'lucide-react';
import { UserRole } from '@/types';
import { NavigationContext } from '../types';
import { HOME_ITEM } from '../shared';

export const documentosNavigation: NavigationContext = {
    basePath: '/documentos',
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
                    requiredPermissions: ['DOC_VIEW'],
                    requiredRoles: [UserRole.ADMIN, UserRole.EMPLOYEE],
                },
                {
                    label: 'Anexar Documentos',
                    icon: Upload,
                    path: '/documentos/empresa',
                    requiredPermissions: ['DOC_ATTACH'],
                },
                {
                    label: 'Documentos Exigidos',
                    icon: FilePlus,
                    path: '/documentos/cadastrar',
                    requiredPermissions: ['DOC_REGISTER'],
                    requiredRoles: [UserRole.ADMIN, UserRole.EMPLOYEE],
                },
                {
                    label: 'Colaboradores',
                    icon: Users,
                    path: '/documentos/colaboradores',
                    requiredRoles: [UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.SUPPLIER],
                },
                {
                    label: 'Gestão Colaboradores',
                    icon: UserCheck,
                    path: '/documentos/colaboradores-gestao',
                    requiredPermissions: ['DOC_VIEW'],
                    requiredRoles: [UserRole.ADMIN, UserRole.EMPLOYEE],
                },
                {
                    label: 'Docs Exigidos Colaboradores',
                    icon: UserPlus,
                    path: '/documentos/cadastrar-colaboradores',
                    requiredPermissions: ['DOC_REGISTER'],
                },
                {
                    label: 'Cadastrar Documento',
                    icon: FileCheck,
                    path: '/documentos/cadastrar-documento',
                    requiredPermissions: ['DOC_VIEW'],
                },
            ],
        },
    ],
    allowedRoles: [UserRole.ADMIN, UserRole.SUPPLIER, UserRole.EMPLOYEE],
};
