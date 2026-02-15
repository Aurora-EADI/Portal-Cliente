import React from 'react';
import { UserRole } from '@/types';

export interface NavItem {
    label: string;
    icon: React.ComponentType<{ size?: number }>;
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
}
