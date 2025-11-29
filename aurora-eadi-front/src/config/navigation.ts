import { Home, Shield, FileText, DollarSign, FileBarChart } from 'lucide-react';
import { UserRole } from '@/types';

export interface NavItem {
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  path: string;
}

// Definir navegação para cada contexto/página
export interface NavigationContext {
  basePath: string; // Caminho base da página
  items: NavItem[]; // Itens que aparecem SOMENTE nessa página
  allowedRoles?: UserRole[]; // (Opcional) Quais roles podem acessar
}

export const navigationContexts: NavigationContext[] = [
  // Navegação para a página de Documentos
  {
    basePath: '/documentos',
    items: [
      {
        label: 'Home',
        icon: Home,
        path: '/modules',
      },
      {
        label: 'Gestão de Documentos',
        icon: Shield,
        path: '/documentos',
      },
    ],
    allowedRoles: [UserRole.ADMIN],
  },
  
  // Navegação para a página de Faturamento
  {
    basePath: '/faturamento',
    items: [
      {
        label: 'Home',
        icon: Home,
        path: '/modules',
      },
      {
        label: 'Relatório CutOFF',
        icon: FileBarChart,
        path: '/faturamento',
      },
    ],
    allowedRoles: [UserRole.ADMIN],
  },

  // Navegação para a página de Supplier
  {
    basePath: '/supplier',
    items: [
      {
        label: 'Home',
        icon: Home,
        path: '/modules',
      },
      {
        label: 'Meus Documentos',
        icon: FileText,
        path: '/supplier',
      },
    ],
    allowedRoles: [UserRole.SUPPLIER],
  },

  // Navegação padrão (Home/Modules) - quando não está em nenhuma página específica
  {
    basePath: '/modules',
    items: [
      {
        label: 'Home',
        icon: Home,
        path: '/modules',
      },
    ],
    allowedRoles: [UserRole.ADMIN, UserRole.SUPPLIER],
  },
];

// Função para obter os itens de navegação baseado no path atual
export const getNavigationByPath = (currentPath: string): NavItem[] => {
  // Encontrar o contexto que corresponde ao path atual
  const context = navigationContexts.find(ctx => 
    currentPath.startsWith(ctx.basePath)
  );

  // Se encontrou contexto específico, retorna seus itens
  if (context) {
    return context.items;
  }

  // Fallback: retorna apenas Home
  return [
    {
      label: 'Home',
      icon: Home,
      path: '/modules',
    }
  ];
};

// Função para verificar se usuário pode acessar o contexto
export const canAccessContext = (currentPath: string, userRole: UserRole): boolean => {
  const context = navigationContexts.find(ctx => 
    currentPath.startsWith(ctx.basePath)
  );

  if (!context || !context.allowedRoles) {
    return true; 
  }

  return context.allowedRoles.includes(userRole);
};