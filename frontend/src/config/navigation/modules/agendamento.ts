import { NavigationContext } from '../types';
import { gruposOperacao } from './grupos';

/**
 * Agendamento e Averbação aparecem juntos: a sidebar mostra um contexto por
 * vez, e sem o grupo de averbação aqui não haveria como chegar nele pelo menu.
 */
export const agendamentoFCLNavigation: NavigationContext = {
  basePath: '/agendamento',
  staticOnly: true,
  items: gruposOperacao,
};
