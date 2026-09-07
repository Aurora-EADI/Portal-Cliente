import { FileCheck, FilePlus2, FileSignature, ListChecks } from 'lucide-react';
import { NavItem, NavigationContext } from '../types';
import { UserRole } from '@/types';

/**
 * Averbacao Aduaneira — rotas por segmento, nao por querystring.
 *
 * Diferente de `/agendamento?tab=`, cada tela aqui e uma rota Next de verdade:
 * gera entrada de historico, permite code-splitting e pode ser autorizada por
 * si so. `requiredRoles` apenas esconde do menu — quem barra o acesso e o
 * RoleGuard na pagina, e a palavra final e sempre do backend.
 */
const itensAverbacao: NavItem[] = [
  {
    label: 'Averbação Aduaneira',
    icon: FileCheck,
    path: '/averbacao',
    isGroup: true,
    children: [
      {
        label: 'Processos',
        icon: ListChecks,
        path: '/averbacao',
        requiredRoles: [
          UserRole.ADMIN,
          UserRole.EMPLOYEE,
          UserRole.CLIENTE,
          UserRole.DESPACHANTE,
        ],
      },
      {
        label: 'Nova Averbação',
        icon: FilePlus2,
        path: '/averbacao/novo',
        requiredRoles: [UserRole.DESPACHANTE],
      },
      {
        label: 'Procurações',
        icon: FileSignature,
        path: '/procuracoes',
        requiredRoles: [UserRole.DESPACHANTE],
      },
    ],
  },
];

// TRANSPORTADORA fica de fora: o menu nao aparece e o RoleGuard redireciona.
const rolesDoModulo = [
  UserRole.ADMIN,
  UserRole.EMPLOYEE,
  UserRole.CLIENTE,
  UserRole.DESPACHANTE,
];

export const averbacaoNavigation: NavigationContext = {
  basePath: '/averbacao',
  staticOnly: true,
  items: itensAverbacao,
  allowedRoles: rolesDoModulo,
};

/**
 * `/procuracoes` e rota de primeiro nivel (a spec pede assim), mas
 * findNavigationContext resolve o contexto por prefixo de basePath — sem este
 * segundo registro, entrar em /procuracoes trocaria a sidebar inteira e o
 * usuario perderia o grupo Averbação de vista. Mesmos itens, outro basePath.
 */
export const procuracoesNavigation: NavigationContext = {
  basePath: '/procuracoes',
  staticOnly: true,
  items: itensAverbacao,
  allowedRoles: rolesDoModulo,
};
