import { Home, Shield, FileText, DollarSign, FileBarChart, ListChecks, UserPlus, ShieldCheck, Building, Truck, FilePlus, Upload, Ship, Factory, User, Building2, List, Wrench, Plus, History as HistoryIcon, Plane, Calculator, Package, Kanban } from 'lucide-react';
import { UserRole } from '@/types';

export interface NavItem {
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  path: string;
  requiredPermissions?: string[]; // Permissões necessárias para acessar esta rota
  requiredRoles?: UserRole[]; // Roles necessárias para acessar esta rota
  children?: NavItem[]; // Subitens para grupos colapsáveis
  isGroup?: boolean; // Indica se é um grupo (não tem path próprio)
}

// Definir navegação para cada contexto/página
export interface NavigationContext {
  basePath: string; // Caminho base da página
  items: NavItem[]; // Itens que aparecem SOMENTE nessa página
  allowedRoles?: UserRole[]; // (Opcional) Quais roles podem acessar
}

// 🚀 OTIMIZAÇÃO: Map para lookup O(1) em vez de busca linear O(n)
// Criado uma única vez no carregamento do módulo
const navigationContextMap = new Map<string, NavigationContext>();

// Função para obter os itens de navegação baseado no path atual E no role do usuário
export const getNavigationByPathAndRole = (
  currentPath: string,
  userRole: UserRole
): NavItem[] => {
  // Tenta buscar contexto exato primeiro (O(1))
  let context = navigationContextMap.get(currentPath);

  // Se não encontrou exato, busca por prefixo (fallback para compatibilidade)
  if (!context) {
    context = navigationContexts.find(ctx =>
      currentPath.startsWith(ctx.basePath)
    );
  }

  if (!context) {
    // Fallback: retorna apenas Home
    return [{ label: 'Home', icon: Home, path: '/modules' }];
  }
  // ✅ Filtra itens que o usuário pode ver
  return context.items.filter(item => {
    // Se não tem requiredRoles, todos podem ver
    if (!item.requiredRoles || item.requiredRoles.length === 0) {
      return true;
    }
    // Caso contrário, verifica se o role do usuário está na lista permitida
    return item.requiredRoles.includes(userRole);
  });
};

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
            requiredRoles: [UserRole.ADMIN],
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
        label: 'Faturamento',
        icon: DollarSign,
        path: '/faturamento',
        isGroup: true,
        children: [
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
      },
    ],
    allowedRoles: [UserRole.ADMIN, UserRole.EMPLOYEE],
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
        label: 'Fornecedores',
        icon: Truck,
        path: '/fornecedor',
        requiredPermissions: ['FOR_VIEW_LIST'],
      },
    ],
    allowedRoles: [UserRole.ADMIN, UserRole.EMPLOYEE],
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
        label: 'Permissões',
        icon: Shield,
        path: '/permissoes',
        isGroup: true,
        children: [
          {
            label: 'Módulos',
            icon: FileText,
            path: '/permissoes',
          },
          {
            label: 'Catalogo técnico ',
            icon: FileText,
            path: '/permissoes/catalogo',
          },
          {
            label: 'Atividades e Vinculos',
            icon: ListChecks,
            path: '/permissoes/atividades',
          },
          {
            label: 'Usuário',
            icon: UserPlus,
            path: '/permissoes/usuario',
          },
          {
            label: 'Gestão de Permissões',
            icon: ShieldCheck,
            path: '/permissoes/gestao',
          },
        ],
      },
    ],
    allowedRoles: [UserRole.ADMIN],
  },
  {
    basePath: '/comercial',
    items: [
      {
        label: 'Home',
        icon: Home,
        path: '/modules',
      },
      {
        label: 'Simulações',
        icon: Calculator,
        path: '/simulacoes',
        isGroup: true,
        children: [
          {
            label: 'Simulação Marítima',
            icon: Ship,
            path: '/comercial',
          },
          {
            label: 'Simulação Aérea',
            icon: Plane,
            path: '/aereo',
          },
        ],
      },
      {
        label: 'Lista de simulação Marítima',
        icon: HistoryIcon,
        path: '/comercial/history',
      },
      {
        label: 'Serviços',
        icon: Wrench,
        path: '/servicos',
      },
    ],
    allowedRoles: [UserRole.ADMIN, UserRole.EMPLOYEE],
  },
  {
    basePath: '/aereo',
    items: [
      {
        label: 'Home',
        icon: Home,
        path: '/modules',
      },
      {
        label: 'Simulações',
        icon: Calculator,
        path: '/simulacoes',
        isGroup: true,
        children: [
          {
            label: 'Simulação Marítima',
            icon: Ship,
            path: '/comercial',
          },
          {
            label: 'Simulação Aérea',
            icon: Plane,
            path: '/aereo',
          },
        ],
      },
      {
        label: 'Lista de simulação Aérea',
        icon: HistoryIcon,
        path: '/aereo/history',
      },
      {
        label: 'Serviços',
        icon: Wrench,
        path: '/servicos',
      },
    ],
    allowedRoles: [UserRole.ADMIN, UserRole.EMPLOYEE],
  },
  {
    basePath: '/servicos',
    items: [
      {
        label: 'Home',
        icon: Home,
        path: '/modules',
      },
      {
        label: 'Serviços',
        icon: Wrench,
        path: '/servicos',
      },
      {
        label: 'Cadastrar Serviço',
        icon: Plus,
        path: '/servicos/cadastro',
      },
    ],
    allowedRoles: [UserRole.ADMIN, UserRole.EMPLOYEE],
  },
  {
    basePath: '/simulacoes',
    items: [
      {
        label: 'Home',
        icon: Home,
        path: '/modules',
      },
      {
        label: 'Simulações',
        icon: Calculator,
        path: '/simulacoes',
        isGroup: true,
        children: [
          {
            label: 'Simulação Marítima',
            icon: Ship,
            path: '/comercial',
          },
          {
            label: 'Simulação Aérea',
            icon: Plane,
            path: '/aereo',
          },
        ],
      },
      {
        label: 'Serviços',
        icon: Wrench,
        path: '/servicos',
      },
    ],
    allowedRoles: [UserRole.ADMIN, UserRole.EMPLOYEE],
  },
  {
    basePath: '/cliente',
    items: [
      {
        label: 'Home',
        icon: Home,
        path: '/modules',
      },
      {
        label: 'Lista Clientes',
        icon: List,
        path: '/cliente',
      },
      {
        label: 'Clientes',
        icon: Building2,
        path: '/cliente/cadastro',
      },
    ],
    allowedRoles: [UserRole.ADMIN, UserRole.EMPLOYEE],
  },

  // Navegação para a página de Armazém
  {
    basePath: '/armazem',
    items: [
      {
        label: 'Home',
        icon: Home,
        path: '/modules',
      },
      {
        label: 'Armazém',
        icon: Package,
        path: '/armazem',
        isGroup: true,
        children: [
          {
            label: 'Kanban Containers',
            icon: Kanban,
            path: '/armazem/kanban',
          },
        ],
      },
    ],
    allowedRoles: [UserRole.ADMIN, UserRole.EMPLOYEE],
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
    allowedRoles: [UserRole.ADMIN, UserRole.SUPPLIER, UserRole.SUPPLIER],
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

// 🚀 OTIMIZAÇÃO: Popula o Map uma única vez no carregamento do módulo
navigationContexts.forEach(ctx => {
  navigationContextMap.set(ctx.basePath, ctx);
});