/**
 * Route Registry - Lista centralizada de todas as rotas/páginas disponíveis no sistema.
 *
 * Usado para:
 * - Dropdown de seleção de rota no cadastro de módulos
 * - Dropdown de sub-rotas no cadastro de atividades
 * - Validação frontend de rotas válidas
 */

export interface RouteDefinition {
  path: string;
  label: string;
  icon: string;
  parentPath?: string;
  isModuleRoot: boolean;
}

// ===== Rotas de módulos (root) =====
export const MODULE_ROUTES: RouteDefinition[] = [
  { path: '/documentos', label: 'Documentos', icon: 'FileText', isModuleRoot: true },
  { path: '/faturamento', label: 'Faturamento', icon: 'CreditCard', isModuleRoot: true },
  { path: '/fornecedor', label: 'Fornecedor', icon: 'Truck', isModuleRoot: true },
  { path: '/permissoes', label: 'Permissões', icon: 'Shield', isModuleRoot: true },
  { path: '/comercial', label: 'Comercial', icon: 'ShoppingCart', isModuleRoot: true },
  { path: '/aereo', label: 'Aéreo', icon: 'Briefcase', isModuleRoot: true },
  { path: '/servicos', label: 'Serviços', icon: 'Wrench', isModuleRoot: true },
  { path: '/simulacoes', label: 'Simulações', icon: 'BarChart3', isModuleRoot: true },
  { path: '/cliente', label: 'Cliente', icon: 'Users', isModuleRoot: true },
  { path: '/dta', label: 'DTA', icon: 'Package', isModuleRoot: true },
  { path: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard', isModuleRoot: true },
];

// ===== Sub-rotas (páginas internas dos módulos) =====
export const SUB_ROUTES: RouteDefinition[] = [
  // DTA
  { path: '/dta/painel', label: 'Painel CT-e', icon: 'LayoutDashboard', parentPath: '/dta', isModuleRoot: false },
  { path: '/dta/maritimo', label: 'Processos Marítimos', icon: 'Ship', parentPath: '/dta', isModuleRoot: false },

  // Comercial
  { path: '/comercial/simulador', label: 'Simulador Marítimo', icon: 'Ship', parentPath: '/comercial', isModuleRoot: false },
  { path: '/comercial/history', label: 'Lista de Simulação Marítima', icon: 'FileText', parentPath: '/comercial', isModuleRoot: false },

  // Faturamento
  { path: '/faturamento/detalhado', label: 'Faturamento Detalhado', icon: 'FileBarChart', parentPath: '/faturamento', isModuleRoot: false },
  { path: '/faturamento/cutoff', label: 'Relatório CutOff', icon: 'FileSpreadsheet', parentPath: '/faturamento', isModuleRoot: false },

  // Fornecedor
  { path: '/fornecedor/lista', label: 'Lista de Fornecedores', icon: 'List', parentPath: '/fornecedor', isModuleRoot: false },

  // Aéreo
  { path: '/aereo/simulador', label: 'Simulador Aéreo', icon: 'Plane', parentPath: '/aereo', isModuleRoot: false },
  { path: '/aereo/history', label: 'Lista de Simulação Aérea', icon: 'FileText', parentPath: '/aereo', isModuleRoot: false },

  // Serviços
  { path: '/servicos/lista', label: 'Lista de Serviços', icon: 'Wrench', parentPath: '/servicos', isModuleRoot: false },
  { path: '/servicos/cadastro', label: 'Cadastrar Serviço', icon: 'Plus', parentPath: '/servicos', isModuleRoot: false },

  // Cliente
  { path: '/cliente/lista', label: 'Lista de Clientes', icon: 'Users', parentPath: '/cliente', isModuleRoot: false },

  // Documentos
  { path: '/documentos/gestao', label: 'Gestão Documentos', icon: 'Shield', parentPath: '/documentos', isModuleRoot: false },
  { path: '/documentos/empresa', label: 'Anexar Documentos', icon: 'Upload', parentPath: '/documentos', isModuleRoot: false },
  { path: '/documentos/cadastrar', label: 'Documentos Exigidos', icon: 'FilePlus', parentPath: '/documentos', isModuleRoot: false },
  { path: '/documentos/colaboradores', label: 'Colaboradores', icon: 'Users', parentPath: '/documentos', isModuleRoot: false },
  { path: '/documentos/colaboradores-gestao', label: 'Gestão Colaboradores', icon: 'UserCheck', parentPath: '/documentos', isModuleRoot: false },
  { path: '/documentos/cadastrar-colaboradores', label: 'Docs Exigidos Colaboradores', icon: 'UserPlus', parentPath: '/documentos', isModuleRoot: false },
  { path: '/documentos/cadastrar-documento', label: 'Cadastrar Documento', icon: 'FileCheck', parentPath: '/documentos', isModuleRoot: false },

  // Permissões
  { path: '/permissoes/catalogo', label: 'Catálogo Técnico', icon: 'Database', parentPath: '/permissoes', isModuleRoot: false },
  { path: '/permissoes/atividades', label: 'Atividades e Vínculos', icon: 'Layers', parentPath: '/permissoes', isModuleRoot: false },
  { path: '/permissoes/usuario', label: 'Usuário', icon: 'Users', parentPath: '/permissoes', isModuleRoot: false },
  { path: '/permissoes/gestao', label: 'Gestão de Permissões', icon: 'Shield', parentPath: '/permissoes', isModuleRoot: false },

  // Dashboard
  { path: '/dashboard/kanban', label: 'Kanban Containers', icon: 'LayoutDashboard', parentPath: '/dashboard', isModuleRoot: false },
];

// ===== Todas as rotas =====
export const ALL_ROUTES: RouteDefinition[] = [...MODULE_ROUTES, ...SUB_ROUTES];

// ===== Utilitários =====

/** Retorna apenas as rotas raiz de módulos */
export function getModuleRoutes(): RouteDefinition[] {
  return MODULE_ROUTES;
}

/** Retorna as sub-rotas de um módulo dado o parentPath */
export function getSubRoutes(parentPath: string): RouteDefinition[] {
  return SUB_ROUTES.filter((r) => r.parentPath === parentPath);
}

/** Busca uma rota pelo path exato */
export function getRouteByPath(path: string): RouteDefinition | undefined {
  return ALL_ROUTES.find((r) => r.path === path);
}

/** Retorna todos os paths como array de strings */
export function getAllPaths(): string[] {
  return ALL_ROUTES.map((r) => r.path);
}

/** Retorna todos os paths de módulos */
export function getModulePaths(): string[] {
  return MODULE_ROUTES.map((r) => r.path);
}

/** Retorna todos os paths de sub-rotas */
export function getSubRoutePaths(): string[] {
  return SUB_ROUTES.map((r) => r.path);
}
