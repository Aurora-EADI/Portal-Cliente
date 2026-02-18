/**
 * Lista de rotas válidas para módulos e sub-páginas.
 * Espelha o registry do frontend para validação server-side.
 */

export interface AvailableRoute {
  path: string;
  label: string;
  icon: string;
  parentPath?: string;
}

export const AVAILABLE_MODULE_ROUTES: AvailableRoute[] = [
  { path: '/documentos', label: 'Documentos', icon: 'FileText' },
  { path: '/faturamento', label: 'Faturamento', icon: 'CreditCard' },
  { path: '/fornecedor', label: 'Fornecedor', icon: 'Truck' },
  { path: '/permissoes', label: 'Permissões', icon: 'Shield' },
  { path: '/comercial', label: 'Comercial', icon: 'ShoppingCart' },
  { path: '/aereo', label: 'Aéreo', icon: 'Briefcase' },
  { path: '/servicos', label: 'Serviços', icon: 'Wrench' },
  { path: '/simulacoes', label: 'Simulações', icon: 'BarChart3' },
  { path: '/cliente', label: 'Cliente', icon: 'Users' },
  { path: '/ccte', label: 'CCTE', icon: 'Package' },
  { path: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
];

export const AVAILABLE_SUB_ROUTES: AvailableRoute[] = [
  // CCTE
  { path: '/ccte/painel', label: 'Painel CT-e', icon: 'LayoutDashboard', parentPath: '/ccte' },

  // Comercial
  { path: '/comercial/simulador', label: 'Simulador Marítimo', icon: 'Ship', parentPath: '/comercial' },
  { path: '/comercial/history', label: 'Lista de Simulação Marítima', icon: 'FileText', parentPath: '/comercial' },

  // Faturamento
  { path: '/faturamento/detalhado', label: 'Faturamento Detalhado', icon: 'FileBarChart', parentPath: '/faturamento' },
  { path: '/faturamento/cutoff', label: 'Relatório CutOff', icon: 'FileSpreadsheet', parentPath: '/faturamento' },

  // Fornecedor
  { path: '/fornecedor/lista', label: 'Lista de Fornecedores', icon: 'List', parentPath: '/fornecedor' },

  // Aéreo
  { path: '/aereo/simulador', label: 'Simulador Aéreo', icon: 'Plane', parentPath: '/aereo' },
  { path: '/aereo/history', label: 'Lista de Simulação Aérea', icon: 'FileText', parentPath: '/aereo' },

  // Serviços
  { path: '/servicos/lista', label: 'Lista de Serviços', icon: 'Wrench', parentPath: '/servicos' },
  { path: '/servicos/cadastro', label: 'Cadastrar Serviço', icon: 'Plus', parentPath: '/servicos' },

  // Cliente
  { path: '/cliente/lista', label: 'Lista de Clientes', icon: 'Users', parentPath: '/cliente' },

  // Documentos
  { path: '/documentos/gestao', label: 'Gestão Documentos', icon: 'Shield', parentPath: '/documentos' },
  { path: '/documentos/empresa', label: 'Anexar Documentos', icon: 'Upload', parentPath: '/documentos' },
  { path: '/documentos/cadastrar', label: 'Documentos Exigidos', icon: 'FilePlus', parentPath: '/documentos' },

  // Permissões
  { path: '/permissoes/catalogo', label: 'Catálogo Técnico', icon: 'Database', parentPath: '/permissoes' },
  { path: '/permissoes/atividades', label: 'Atividades e Vínculos', icon: 'Layers', parentPath: '/permissoes' },
  { path: '/permissoes/usuario', label: 'Usuário', icon: 'Users', parentPath: '/permissoes' },
  { path: '/permissoes/gestao', label: 'Gestão de Permissões', icon: 'Shield', parentPath: '/permissoes' },

  // Dashboard
  { path: '/dashboard/kanban', label: 'Kanban Containers', icon: 'LayoutDashboard', parentPath: '/dashboard' },
];

const modulePathSet = new Set(AVAILABLE_MODULE_ROUTES.map((r) => r.path));
const subRoutePathSet = new Set(AVAILABLE_SUB_ROUTES.map((r) => r.path));

export function isValidModuleRoute(path: string): boolean {
  return modulePathSet.has(path);
}

export function isValidSubRoute(path: string): boolean {
  return subRoutePathSet.has(path);
}

export function getSubRoutesForModule(moduleRoute: string): AvailableRoute[] {
  return AVAILABLE_SUB_ROUTES.filter((r) => r.parentPath === moduleRoute);
}
