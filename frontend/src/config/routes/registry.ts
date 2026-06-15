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
  { path: '/permissoes', label: 'Configurador', icon: 'Shield', isModuleRoot: true },
  { path: '/agendamento', label: 'Agendamento FCL', icon: 'CalendarDays', isModuleRoot: true },
];

// ===== Sub-rotas (páginas internas dos módulos) =====
export const SUB_ROUTES: RouteDefinition[] = [
  // Permissões / Configurador
  { path: '/permissoes/catalogo', label: 'Gestão de Funcionalidade', icon: 'Database', parentPath: '/permissoes', isModuleRoot: false },
  { path: '/permissoes/atividades', label: 'Módulo x Funcionalidade', icon: 'Layers', parentPath: '/permissoes', isModuleRoot: false },
  { path: '/permissoes/usuario', label: 'Gestão de Usuário', icon: 'Users', parentPath: '/permissoes', isModuleRoot: false },
  { path: '/permissoes/usuario-mobile', label: 'Usuário Mobile', icon: 'Smartphone', parentPath: '/permissoes', isModuleRoot: false },
  { path: '/permissoes/gestao', label: 'Gestão de Perfis', icon: 'Shield', parentPath: '/permissoes', isModuleRoot: false },
  // Agendamento FCL
  { path: '/agendamento', label: 'Dashboard', icon: 'LayoutDashboard', parentPath: '/agendamento', isModuleRoot: false },
  { path: '/agendamento?tab=wizard', label: 'Novo Agendamento', icon: 'CalendarDays', parentPath: '/agendamento', isModuleRoot: false },
  { path: '/agendamento?tab=gate', label: 'Portaria (Gate)', icon: 'Clock', parentPath: '/agendamento', isModuleRoot: false },
  { path: '/agendamento?tab=dis', label: 'DIs & Containers', icon: 'Package', parentPath: '/agendamento', isModuleRoot: false },
  { path: '/agendamento?tab=drivers', label: 'Motoristas', icon: 'Users', parentPath: '/agendamento', isModuleRoot: false },
  { path: '/agendamento?tab=config', label: 'Configurações', icon: 'SlidersHorizontal', parentPath: '/agendamento', isModuleRoot: false },
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
