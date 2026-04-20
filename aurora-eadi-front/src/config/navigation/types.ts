import { UserRole } from '@/types';
import type { ComponentType } from 'react';

export interface NavItem {
    label: string;
    icon: ComponentType<{ size?: number }>;
    path: string;
    requiredPermissions?: string[];
    requiredRoles?: UserRole[];
    children?: NavItem[];
    isGroup?: boolean;
}

export interface NavigationContext {
    basePath: string;
    items: NavItem[];
    allowedRoles?: UserRole[];
    /** When true, this module's navigation is never overridden by dynamic (DB-driven) data. */
    staticOnly?: boolean;
}
