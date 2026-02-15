import { FileText, Shield, Upload, FilePlus } from 'lucide-react';
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
                    path: '/documentos',
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
                    requiredRoles: [UserRole.ADMIN],
                },
            ],
        },
    ],
    allowedRoles: [UserRole.ADMIN, UserRole.SUPPLIER, UserRole.EMPLOYEE],
};
