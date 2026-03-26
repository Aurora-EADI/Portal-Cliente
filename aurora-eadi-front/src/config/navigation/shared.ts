import { Home, List } from 'lucide-react';
import type { NavItem } from './types';

export const HOME_ITEM = {
    label: 'Home',
    icon: Home,
    path: '/modules',
} satisfies NavItem;

export const CLIENTE_ITEM = {
    label: 'Cliente',
    icon: List,
    path: '/cliente/lista',
} satisfies NavItem;
