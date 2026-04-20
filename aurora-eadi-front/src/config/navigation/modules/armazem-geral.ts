import {
  Package,
  Home as HomeIcon,
  ArrowRightLeft,
  Truck,
  Box,
  ClipboardList,
  FileBarChart,
  ShieldCheck,
  Building2,
  UserCircle,
  LayoutGrid,
  ArrowDownUp,
  BarChart3,
} from 'lucide-react';
import { UserRole } from '@/types';
import type { NavigationContext } from '../types';
import { HOME_ITEM } from '../shared';

export const armazemGeralNavigation: NavigationContext = {
  basePath: '/armazem-geral',
  items: [
    HOME_ITEM,
    {
      label: 'Dashboard',
      icon: FileBarChart,
      path: '/armazem-geral/dashboard',
    },
    {
      label: 'Gestão de Carga',
      icon: Package,
      path: '/armazem-geral/containers',
      isGroup: true,
      children: [
        {
          label: 'Carga Geral',
          icon: Box,
          path: '/armazem-geral/carga-geral',
        },
        {
          label: 'Containers',
          icon: Truck,
          path: '/armazem-geral/containers',
        },
        {
          label: 'Containers AG',
          icon: Package,
          path: '/armazem-geral/containers-ag',
        },
      ]
    },
    {
      label: 'Operações',
      icon: ArrowRightLeft,
      path: '/armazem-geral/transbordos',
      isGroup: true,
      children: [
        {
          label: 'Transbordos',
          icon: ArrowRightLeft,
          path: '/armazem-geral/transbordos',
        },
      ]
    },
    {
      label: 'Controle',
      icon: ClipboardList,
      path: '/armazem-geral/relatorios',
      isGroup: true,
      children: [
        {
          label: 'Auditoria',
          icon: ShieldCheck,
          path: '/armazem-geral/auditoria',
        },
        {
          label: 'Conferentes',
          icon: UserCircle,
          path: '/armazem-geral/conferentes',
        },
        {
          label: 'Fornecedores',
          icon: Building2,
          path: '/armazem-geral/fornecedores-container',
        },
        {
          label: 'Pátio',
          icon: LayoutGrid,
          path: '/armazem-geral/patio',
        },
        {
          label: 'Relatórios',
          icon: ClipboardList,
          path: '/armazem-geral/relatorios',
          isGroup: true,
          children: [
            {
              label: 'Visão Geral',
              icon: BarChart3,
              path: '/armazem-geral/relatorios/dashboard',
            },
            {
              label: 'Entrada e Saída',
              icon: ArrowDownUp,
              path: '/armazem-geral/relatorios/movimentacao',
            },
            {
              label: 'Posição de Pátio',
              icon: LayoutGrid,
              path: '/armazem-geral/relatorios/patio',
            },
          ]
        },
        {
          label: 'Transportadoras',
          icon: Truck,
          path: '/armazem-geral/transportadoras',
        },
      ]
    }
  ],
  allowedRoles: [UserRole.ADMIN, UserRole.EMPLOYEE],
};
