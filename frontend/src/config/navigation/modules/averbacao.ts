import { NavigationContext } from '../types';
import { UserRole } from '@/types';
import { gruposOperacao } from './grupos';

// TRANSPORTADORA fica de fora: o menu não aparece e o RoleGuard redireciona.
const rolesDoModulo = [
  UserRole.ADMIN,
  UserRole.EMPLOYEE,
  UserRole.CLIENTE,
  UserRole.DESPACHANTE,
];

export const averbacaoNavigation: NavigationContext = {
  basePath: '/averbacao',
  staticOnly: true,
  items: gruposOperacao,
  allowedRoles: rolesDoModulo,
};

/**
 * `/procuracoes` é rota de primeiro nível (a spec pede assim), mas
 * findNavigationContext resolve o contexto por prefixo de basePath — sem este
 * segundo registro, entrar em /procuracoes trocaria a sidebar inteira.
 */
export const procuracoesNavigation: NavigationContext = {
  basePath: '/procuracoes',
  staticOnly: true,
  items: gruposOperacao,
  allowedRoles: rolesDoModulo,
};
