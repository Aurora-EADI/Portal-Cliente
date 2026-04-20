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
  { path: '/permissoes', label: 'Módulo de Configurador', icon: 'Shield', isModuleRoot: true },
  { path: '/comercial', label: 'Comercial', icon: 'ShoppingCart', isModuleRoot: true },
  { path: '/aereo', label: 'Aéreo', icon: 'Briefcase', isModuleRoot: true },
  { path: '/servicos', label: 'Gestão de Serviços', icon: 'Wrench', isModuleRoot: true },
  { path: '/simulacoes', label: 'Cotações', icon: 'BarChart3', isModuleRoot: true },
  { path: '/cliente', label: 'Gestão de Clientes', icon: 'Users', isModuleRoot: true },
  { path: '/dta', label: 'DTA', icon: 'Package', isModuleRoot: true },
  { path: '/estoque', label: 'Estoque', icon: 'Package', isModuleRoot: true },
  { path: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard', isModuleRoot: true },
  { path: '/recepcao', label: 'Recepção', icon: 'Users', isModuleRoot: true },
  { path: '/armazem-geral', label: 'Armazém Geral', icon: 'Package', isModuleRoot: true },
];

// ===== Sub-rotas (páginas internas dos módulos) =====
export const SUB_ROUTES: RouteDefinition[] = [
  // DTA
  { path: '/dta/painel', label: 'Processos Aéreos', icon: 'LayoutDashboard', parentPath: '/dta', isModuleRoot: false },
  { path: '/dta/maritimo', label: 'Processos Marítimos', icon: 'Ship', parentPath: '/dta', isModuleRoot: false },

  // Comercial
  { path: '/comercial/kanban', label: 'Kanban Cotações', icon: 'KanbanSquare', parentPath: '/comercial', isModuleRoot: false },
  { path: '/comercial/dashboard', label: 'Dashboard Cotações', icon: 'BarChart2', parentPath: '/comercial', isModuleRoot: false },
  { path: '/comercial/simulador', label: 'Simulador Marítimo', icon: 'Ship', parentPath: '/comercial', isModuleRoot: false },
  { path: '/comercial/history', label: 'Gestão de Cotação Marítima', icon: 'FileText', parentPath: '/comercial', isModuleRoot: false },
  { path: '/aereo/simulador', label: 'Simulador Aéreo', icon: 'Plane', parentPath: '/comercial', isModuleRoot: false },
  { path: '/aereo/history', label: 'Gestão de Cotação Aérea', icon: 'FileText', parentPath: '/comercial', isModuleRoot: false },
  { path: '/simulacoes/propostas', label: 'Kanban Cotações', icon: 'KanbanSquare', parentPath: '/simulacoes', isModuleRoot: false },

  // Faturamento
  { path: '/faturamento/detalhado', label: 'Faturamento Detalhado', icon: 'FileBarChart', parentPath: '/faturamento', isModuleRoot: false },
  { path: '/faturamento/cutoff', label: 'Relatório CutOff', icon: 'FileSpreadsheet', parentPath: '/faturamento', isModuleRoot: false },

  // Estoque
  { path: '/estoque/historico-lote', label: 'Histórico Lote', icon: 'LayoutDashboard', parentPath: '/estoque', isModuleRoot: false },
  { path: '/estoque/inventario-simplificado', label: 'Inventário Simplificado', icon: 'LayoutDashboard', parentPath: '/estoque', isModuleRoot: false },

  // Fornecedor
  { path: '/fornecedor/lista', label: 'Fornecedor', icon: 'List', parentPath: '/fornecedor', isModuleRoot: false },

  // Aéreo
  { path: '/aereo/simulador', label: 'Simulador Aéreo', icon: 'Plane', parentPath: '/aereo', isModuleRoot: false },
  { path: '/aereo/history', label: 'Gestão de Cotação Aérea', icon: 'FileText', parentPath: '/aereo', isModuleRoot: false },

  // Serviços
  { path: '/servicos/lista', label: 'Lista de Serviços', icon: 'Wrench', parentPath: '/servicos', isModuleRoot: false },
  { path: '/servicos/cadastro', label: 'Cadastrar Serviço', icon: 'Plus', parentPath: '/servicos', isModuleRoot: false },

  // Cliente
  { path: '/cliente/lista', label: 'Lista de Clientes', icon: 'Users', parentPath: '/cliente', isModuleRoot: false },

  // Documentos
  { path: '/documentos/gestao', label: 'Documentos x Fornecedor', icon: 'Shield', parentPath: '/documentos', isModuleRoot: false },
  { path: '/documentos/empresa', label: 'Anexar documentos', icon: 'Upload', parentPath: '/documentos', isModuleRoot: false },
  { path: '/documentos/cadastrar', label: 'Tipos de Documentos', icon: 'FilePlus', parentPath: '/documentos', isModuleRoot: false },
  { path: '/documentos/colaboradores', label: 'Gestão de Colaboradores', icon: 'Users', parentPath: '/documentos', isModuleRoot: false },
  { path: '/documentos/cadastrar-colaboradores', label: 'Documentos x Colaborador', icon: 'UserPlus', parentPath: '/documentos', isModuleRoot: false },

  // Permissões
  { path: '/permissoes/catalogo', label: 'Gestão de Funcionalidade', icon: 'Database', parentPath: '/permissoes', isModuleRoot: false },
  { path: '/permissoes/atividades', label: 'Módulo x Funcionalidade', icon: 'Layers', parentPath: '/permissoes', isModuleRoot: false },
  { path: '/permissoes/usuario', label: 'Gestão de Usuário', icon: 'Users', parentPath: '/permissoes', isModuleRoot: false },
  { path: '/permissoes/usuario-mobile', label: 'Usuário Mobile', icon: 'Smartphone', parentPath: '/permissoes', isModuleRoot: false },
  { path: '/permissoes/gestao', label: 'Gestão de Perfis', icon: 'Shield', parentPath: '/permissoes', isModuleRoot: false },

  // Simulações
  { path: '/simulacoes/dashboard', label: 'Dashboard de Cotações', icon: 'BarChart2', parentPath: '/simulacoes', isModuleRoot: false },
  { path: '/simulacoes/maritimo', label: 'Cotação Marítima', icon: 'Ship', parentPath: '/simulacoes', isModuleRoot: false },
  { path: '/simulacoes/historico-maritimo', label: 'Histórico Marítimo', icon: 'ClipboardList', parentPath: '/simulacoes', isModuleRoot: false },
  { path: '/simulacoes/aereo', label: 'Cotação Aérea', icon: 'Plane', parentPath: '/simulacoes', isModuleRoot: false },
  { path: '/simulacoes/historico-aereo', label: 'Histórico Aéreo', icon: 'FileSearch', parentPath: '/simulacoes', isModuleRoot: false },

  // Dashboard
  { path: '/dashboard/kanban', label: 'Transito no Recinto', icon: 'LayoutDashboard', parentPath: '/dashboard', isModuleRoot: false },
  { path: '/dashboard/conferencia-de-carga', label: 'Conferência de Carga', icon: 'ClipboardList', parentPath: '/dashboard', isModuleRoot: false },

  // Recepção
  { path: '/recepcao/contatos', label: 'Lista de Ramais', icon: 'Users', parentPath: '/recepcao', isModuleRoot: false },
  { path: '/recepcao/agenda', label: 'Agenda de Visitantes', icon: 'CalendarDays', parentPath: '/recepcao', isModuleRoot: false },

  // Armazém Geral
  { path: '/armazem-geral/dashboard', label: 'Dashboard', icon: 'FileBarChart', parentPath: '/armazem-geral', isModuleRoot: false },
  { path: '/armazem-geral/carga-geral', label: 'Carga Geral', icon: 'Box', parentPath: '/armazem-geral', isModuleRoot: false },
  { path: '/armazem-geral/containers', label: 'Containers', icon: 'Truck', parentPath: '/armazem-geral', isModuleRoot: false },
  { path: '/armazem-geral/containers-ag', label: 'Containers AG', icon: 'Package', parentPath: '/armazem-geral', isModuleRoot: false },
  { path: '/armazem-geral/transbordos', label: 'Transbordos', icon: 'ArrowRightLeft', parentPath: '/armazem-geral', isModuleRoot: false },
  { path: '/armazem-geral/auditoria', label: 'Auditoria', icon: 'ShieldCheck', parentPath: '/armazem-geral', isModuleRoot: false },
  { path: '/armazem-geral/conferentes', label: 'Conferentes', icon: 'UserCircle', parentPath: '/armazem-geral', isModuleRoot: false },
  { path: '/armazem-geral/fornecedores-container', label: 'Fornecedores', icon: 'Building2', parentPath: '/armazem-geral', isModuleRoot: false },
  { path: '/armazem-geral/patio', label: 'Pátio', icon: 'LayoutGrid', parentPath: '/armazem-geral', isModuleRoot: false },
  { path: '/armazem-geral/relatorios', label: 'Relatórios', icon: 'ClipboardList', parentPath: '/armazem-geral', isModuleRoot: false },
  { path: '/armazem-geral/relatorios/movimentacao', label: 'Entrada e Saída', icon: 'ArrowDownUp', parentPath: '/armazem-geral', isModuleRoot: false },
  { path: '/armazem-geral/relatorios/patio', label: 'Posição de Pátio', icon: 'LayoutGrid', parentPath: '/armazem-geral', isModuleRoot: false },
  { path: '/armazem-geral/relatorios/dashboard', label: 'Visão Geral', icon: 'BarChart3', parentPath: '/armazem-geral', isModuleRoot: false },
  { path: '/armazem-geral/transportadoras', label: 'Transportadoras', icon: 'Truck', parentPath: '/armazem-geral', isModuleRoot: false },
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
