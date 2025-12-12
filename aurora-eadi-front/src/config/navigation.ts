import { Home, Shield, FileText, DollarSign, FileBarChart, ListChecks, UserPlus, ShieldCheck, Building, Truck, FilePlus, Upload } from 'lucide-react';
import { UserRole } from '@/types';

export interface NavItem {
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  path: string;
  requiredPermissions?: string[]; // Permissões necessárias para acessar esta rota
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
        requiredPermissions: [''],
      },
      {
        label: 'Anexar Documentos',
        icon: Upload,
        path: '/documentos/empresa',
      },
      {
        label: 'Cadastrar tipo Documento',
        icon: FilePlus,
        path: '/documentos/cadastrar',
        requiredPermissions: ['DOC_REGISTER'],
      },
    ],
    allowedRoles: [UserRole.ADMIN, UserRole.SUPPLIER],
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
        label: 'Faturamento Detalhado',
        icon: FileBarChart,
        path: '/faturamento',
        requiredPermissions: ['FAT_VIEW_DET'],
      },
      {
        label: 'Relatório CutOff',
        icon: FileBarChart,
        path: '/faturamento/cutoff',
        requiredPermissions: ['FAT_VIEW_CUTOFF'],
      },
    ],
    allowedRoles: [UserRole.ADMIN],
  },
  {
    basePath: '/fornecedor',
    items: [
      {
        label: 'Home',
        icon: Home,
        path: '/modules',
      },
      {
        label: 'Cadastro Fornecedor',
        icon: Truck,
        path: '/fornecedor',
        requiredPermissions: ['FOR_REGISTER'],
      },
    ],
    allowedRoles: [UserRole.ADMIN],
  },
  {
    basePath: '/permissoes',
    items: [
      {
        label: 'Home',
        icon: Home,
        path: '/modules',
      },
      {
        label: 'Cadastro de Módulos',
        icon: FileText,
        path: '/permissoes',
      },
      {
        label: 'Atividades e Vinculos',
        icon: ListChecks,
        path: '/permissoes/atividades',
      },
      {
        label: 'Cadastro de Usuários',
        icon: UserPlus,
        path: '/permissoes/usuario',
      },
      {
        label: 'Gestão de Permissões',
        icon: ShieldCheck,
        path: '/permissoes/gestao',
      },
    ],
    allowedRoles: [UserRole.ADMIN],
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