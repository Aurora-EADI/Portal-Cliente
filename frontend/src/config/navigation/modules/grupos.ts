import {
  CalendarDays,
  Clock,
  Container,
  FileCheck,
  FilePlus2,
  FileSignature,
  LayoutDashboard,
  ListChecks,
  SlidersHorizontal,
  Truck,
  Users,
} from 'lucide-react';
import { NavItem } from '../types';
import { UserRole } from '@/types';

/**
 * Grupos de menu compartilhados entre os módulos de Agendamento e Averbação.
 *
 * Ficam num arquivo só porque a sidebar mostra um contexto por vez, resolvido
 * pelo prefixo da rota: os dois módulos precisam exibir os dois grupos, senão
 * a averbação só apareceria depois de o usuário já estar dentro dela — e não
 * haveria como chegar lá pelo menu. Cada módulo importar o outro criaria ciclo.
 */

export const grupoAgendamento: NavItem[] = [
  {
    label: 'Agendamento FCL',
    icon: CalendarDays,
    path: '/agendamento',
    isGroup: true,
    children: [
      { label: 'Dashboard', icon: LayoutDashboard, path: '/agendamento' },
      {
        label: 'Portaria (Gate)',
        icon: Clock,
        path: '/agendamento?tab=gate',
        requiredRoles: [UserRole.ADMIN, UserRole.EMPLOYEE],
      },
      {
        label: 'DIs & Containers',
        icon: Container,
        path: '/agendamento?tab=dis',
        requiredRoles: [UserRole.ADMIN, UserRole.EMPLOYEE],
      },
      {
        label: 'Motoristas',
        icon: Users,
        path: '/agendamento?tab=drivers',
        requiredRoles: [
          UserRole.ADMIN,
          UserRole.EMPLOYEE,
          UserRole.CLIENTE,
          UserRole.DESPACHANTE,
          UserRole.TRANSPORTADORA,
        ],
      },
      {
        label: 'Transportadoras',
        icon: Truck,
        path: '/agendamento?tab=transportadoras',
        requiredRoles: [UserRole.CLIENTE, UserRole.DESPACHANTE],
      },
      {
        label: 'Configurações',
        icon: SlidersHorizontal,
        path: '/agendamento?tab=config',
        requiredRoles: [UserRole.ADMIN, UserRole.EMPLOYEE],
      },
    ],
  },
];

/**
 * Averbação usa rotas por segmento, não querystring: cada tela é rota Next de
 * verdade, gera entrada de histórico e pode ser autorizada por si só.
 *
 * `requiredRoles` só esconde do menu. Quem barra o acesso é o RoleGuard na
 * página, e a palavra final é sempre do backend. É também o que mantém a
 * TRANSPORTADORA fora: sem filhos sobreviventes, o grupo some da navegação.
 */
export const grupoAverbacao: NavItem[] = [
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

/** Os dois grupos, na ordem em que aparecem na sidebar. */
export const gruposOperacao: NavItem[] = [
  ...grupoAgendamento,
  ...grupoAverbacao,
];
