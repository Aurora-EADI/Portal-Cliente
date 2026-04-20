import { FileText, Shield, Upload, FilePlus, Users, UserPlus, List, Truck } from 'lucide-react';
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
                    label: 'Anexar documentos',
                    icon: Upload,
                    path: '/documentos/empresa',
                    requiredRoles: [UserRole.SUPPLIER],
                },
                {
                    label: 'Documentos x Colaborador',
                    icon: UserPlus,
                    path: '/documentos/cadastrar-colaboradores',
                    requiredRoles: [UserRole.ADMIN, UserRole.EMPLOYEE],
                },
                {
                    label: 'Documentos x Fornecedor',
                    icon: Shield,
                    path: '/documentos/gestao',
                    requiredRoles: [UserRole.ADMIN, UserRole.EMPLOYEE],
                },
                {
                    label: 'Gestão de Colaboradores',
                    icon: Users,
                    path: '/documentos/colaboradores',
                    requiredRoles: [UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.SUPPLIER],
                },
                {
                    label: 'Tipos de Documentos',
                    icon: FilePlus,
                    path: '/documentos/cadastrar',
                    requiredRoles: [UserRole.ADMIN, UserRole.EMPLOYEE],
                },
            ],
        },
        {
            label: 'Fornecedor',
            icon: Truck,
            path: '/fornecedor/lista',
            requiredRoles: [UserRole.ADMIN, UserRole.EMPLOYEE],
        },
    ],
    allowedRoles: [UserRole.ADMIN, UserRole.SUPPLIER, UserRole.EMPLOYEE],
};
