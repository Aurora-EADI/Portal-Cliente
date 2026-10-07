/**
 * Conteúdo dos tours de ajuda (Driver.js), um por página.
 *
 * O texto mora aqui, fora das telas, para ser revisado por quem conhece o
 * negócio sem mexer em componente. Cada passo aponta para um `data-tour` da
 * tela; passo sem `elemento` vira um balão central, o que garante explicação
 * até em página ainda não marcada. O tour só abre pelo botão Ajuda.
 */
import { UserRole } from '@/types';

export type TourPageId =
  | 'agendamento.dashboard'
  | 'agendamento.wizard'
  | 'agendamento.gate'
  | 'agendamento.dis'
  | 'agendamento.drivers'
  | 'agendamento.transportadoras'
  | 'agendamento.config'
  | 'averbacao'
  | 'averbacao.detalhe'
  | 'procuracoes';

export interface TourStep {
  /** Seletor do elemento destacado. Sem ele, o balão aparece no centro. */
  elemento?: string;
  titulo: string;
  descricao: string;
  /** Perfis que veem o passo. Omitido: todos. */
  perfis?: UserRole[];
  lado?: 'top' | 'right' | 'bottom' | 'left';
}

export interface PageTour {
  passos: TourStep[];
}

const INTERNOS = [UserRole.ADMIN, UserRole.EMPLOYEE];
const EXTERNOS = [UserRole.CLIENTE, UserRole.DESPACHANTE, UserRole.TRANSPORTADORA];
const CLIENTE_DESPACHANTE = [UserRole.CLIENTE, UserRole.DESPACHANTE];

/** Fecha todos os tours: mostra onde a ajuda fica para depois. */
const PASSO_AJUDA: TourStep = {
  elemento: '[data-tour="ajuda"]',
  titulo: 'Ajuda sempre à mão',
  descricao: 'Sempre que tiver dúvida, clique em Ajuda para rever a explicação da página em que você está.',
  lado: 'right',
};

export const TOURS: Record<TourPageId, PageTour> = {
  'agendamento.dashboard': {
    passos: [
      {
        titulo: 'Painel de agendamentos',
        descricao: 'Aqui você acompanha suas DIs liberadas e os agendamentos de retirada de containers.',
        perfis: EXTERNOS,
      },
      {
        elemento: '[data-tour="dashboard-indicadores"]',
        titulo: 'Resumo',
        descricao: 'Totais dos seus agendamentos: quantos existem, quantos já chegaram, quantos aguardam chegada e os no-show.',
        perfis: EXTERNOS,
      },
      {
        elemento: '[data-tour="dashboard-busca"]',
        titulo: 'Busca',
        descricao: 'Encontre rapidamente por número da DI, container, motorista ou placa.',
        perfis: EXTERNOS,
      },
      {
        elemento: '[data-tour="dashboard-tabela"]',
        titulo: 'Suas DIs e agendamentos',
        descricao: 'Cada linha é um container. As DIs disponíveis aparecem primeiro; abaixo, os agendamentos já feitos.',
        perfis: EXTERNOS,
      },
      {
        elemento: '[data-tour="dashboard-status"]',
        titulo: 'Situação do container',
        descricao: 'Mostra se o container está disponível, já atribuído a uma transportadora, ou travado por procuração ou averbação pendente.',
        perfis: EXTERNOS,
      },
      {
        elemento: '[data-tour="dashboard-acao"]',
        titulo: 'Próximo passo',
        descricao: 'O botão da linha leva ao que falta: agendar, atribuir a uma transportadora ou resolver a pendência que trava a DI.',
        perfis: EXTERNOS,
      },
      {
        elemento: '[data-tour="dashboard-comprovante"]',
        titulo: 'Comprovante e cancelamento',
        descricao: 'Em um agendamento feito, imprima o comprovante para o motorista ou cancele se a retirada não for mais acontecer.',
        perfis: EXTERNOS,
      },
      {
        titulo: 'Painel da operação',
        descricao: 'Visão geral dos agendamentos de todos os clientes, com indicadores de comparecimento.',
        perfis: INTERNOS,
      },
      {
        elemento: '[data-tour="admin-abas"]',
        titulo: 'Painéis',
        descricao: 'Alterne entre o painel de agendamentos e o de gestão de pátio.',
        perfis: INTERNOS,
      },
      {
        elemento: '[data-tour="admin-filtros"]',
        titulo: 'Filtros',
        descricao: 'Refine os números por período, operação e transportadora.',
        perfis: INTERNOS,
      },
      {
        elemento: '[data-tour="admin-indicadores"]',
        titulo: 'Indicadores',
        descricao: 'Quantidade de agendamentos e como terminaram: chegou, no-show, no horário ou atrasado.',
        perfis: INTERNOS,
      },
      {
        elemento: '[data-tour="admin-taxas"]',
        titulo: 'Taxas de comparecimento',
        descricao: 'Percentual de agendamentos que compareceram e que faltaram.',
        perfis: INTERNOS,
      },
      PASSO_AJUDA,
    ],
  },

  'agendamento.wizard': {
    passos: [
      {
        titulo: 'Novo agendamento',
        descricao: 'Preencha os dados da retirada em etapas. O rascunho fica salvo se você recarregar a página.',
      },
      {
        elemento: '[data-tour="wizard-modo"]',
        titulo: 'Agendar ou delegar',
        descricao: 'Escolha se você mesmo agenda a retirada ou se atribui o container a uma transportadora, que fará o agendamento.',
        perfis: CLIENTE_DESPACHANTE,
      },
      {
        elemento: '[data-tour="wizard-etapas"]',
        titulo: 'Etapas',
        descricao: 'Mostra em que etapa você está e quantas faltam.',
      },
      {
        elemento: '[data-tour="wizard-formulario"]',
        titulo: 'Dados da etapa',
        descricao: 'Preencha os campos da etapa atual. Motorista e veículo precisam estar cadastrados em Motoristas.',
      },
      {
        elemento: '[data-tour="wizard-navegacao"]',
        titulo: 'Avançar',
        descricao: 'Próximo só libera quando os campos obrigatórios estão completos; o que falta aparece logo acima. Na última etapa, Salvar confirma o agendamento.',
      },
      PASSO_AJUDA,
    ],
  },

  'agendamento.gate': {
    passos: [
      {
        titulo: 'Portaria (Gate)',
        descricao: 'Controle de chegada dos veículos agendados: acompanhe quem chegou, quem está atrasado e registre a entrada. Use os filtros de horário, status e operação para achar o agendamento.',
      },
      PASSO_AJUDA,
    ],
  },

  'agendamento.dis': {
    passos: [
      {
        titulo: 'DIs & Containers',
        descricao: 'Lista das Declarações de Importação averbadas e seus containers, com a situação de procuração e de averbação de cada uma.',
      },
      PASSO_AJUDA,
    ],
  },

  'agendamento.drivers': {
    passos: [
      {
        titulo: 'Motoristas e veículos',
        descricao: 'Cadastre os motoristas e veículos que farão as retiradas. Eles ficam disponíveis para escolha no Novo Agendamento.',
      },
      {
        elemento: '[data-tour="motoristas-abas"]',
        titulo: 'Motoristas ou veículos',
        descricao: 'Alterne entre a lista de motoristas e a de veículos.',
      },
      {
        elemento: '[data-tour="motoristas-novo"]',
        titulo: 'Novo cadastro',
        descricao: 'Cadastra um motorista ou um veículo, conforme a aba aberta. CPF e placa não se repetem.',
      },
      {
        elemento: '[data-tour="motoristas-busca"]',
        titulo: 'Busca',
        descricao: 'Encontre pelo nome, CPF, placa ou modelo.',
      },
      {
        elemento: '[data-tour="motoristas-editar"]',
        titulo: 'Editar',
        descricao: 'Atualize nome, CNH e telefone. O CPF não muda depois do cadastro.',
      },
      PASSO_AJUDA,
    ],
  },

  'agendamento.transportadoras': {
    passos: [
      {
        titulo: 'Transportadoras',
        descricao: 'Atribua suas DIs, inteiras ou por container, às transportadoras que farão a retirada. Cada transportadora só enxerga o que foi atribuído a ela.',
      },
      {
        elemento: '[data-tour="transportadoras-convidar"]',
        titulo: 'Convidar transportadora',
        descricao: 'Transportadora que ainda não usa o portal recebe um convite para criar o acesso.',
      },
      {
        elemento: '[data-tour="transportadoras-busca"]',
        titulo: 'Busca',
        descricao: 'Filtre por DI, lote, cliente ou transportadora.',
      },
      {
        elemento: '[data-tour="transportadoras-status"]',
        titulo: 'Situação da atribuição',
        descricao: 'Pendente: nenhum container atribuído. Parcial: só parte deles. Completo: todos os containers têm transportadora.',
      },
      {
        elemento: '[data-tour="transportadoras-atribuir"]',
        titulo: 'Atribuir',
        descricao: 'Escolha a transportadora e os containers que ela vai retirar.',
      },
      PASSO_AJUDA,
    ],
  },

  'agendamento.config': {
    passos: [
      {
        titulo: 'Configurações de agendamento',
        descricao: 'Gerencie as janelas de atendimento: dias, horários, intervalo entre slots e quantidade de vagas por horário. É daqui que saem os horários oferecidos no agendamento.',
      },
      PASSO_AJUDA,
    ],
  },

  averbacao: {
    passos: [
      {
        titulo: 'Averbação aduaneira',
        descricao: 'Acompanhe os processos de averbação: envie os documentos da DI, veja a análise da equipe Aurora e o que falta corrigir. A DI só pode ser agendada depois que o processo é liberado.',
      },
      PASSO_AJUDA,
    ],
  },

  'averbacao.detalhe': {
    passos: [
      {
        titulo: 'Detalhe do processo',
        descricao: 'Documentos enviados, pendências apontadas na análise e o histórico do processo. Reenvie aqui o que foi recusado.',
      },
      PASSO_AJUDA,
    ],
  },

  procuracoes: {
    passos: [
      {
        titulo: 'Procurações',
        descricao: 'Para agendar em nome de um cliente, o despachante precisa de procuração aprovada. Anexe a procuração de cada cliente e acompanhe a análise.',
      },
      PASSO_AJUDA,
    ],
  },
};

const ABAS_AGENDAMENTO: Record<string, TourPageId> = {
  dashboard: 'agendamento.dashboard',
  wizard: 'agendamento.wizard',
  gate: 'agendamento.gate',
  dis: 'agendamento.dis',
  drivers: 'agendamento.drivers',
  transportadoras: 'agendamento.transportadoras',
  config: 'agendamento.config',
};

/** Página do tour a partir da rota. O Agendamento é uma rota só, trocada por `?tab=`. */
export function resolverPaginaTour(pathname: string, tab: string | null): TourPageId | null {
  if (pathname.startsWith('/agendamento')) return ABAS_AGENDAMENTO[tab ?? 'dashboard'] ?? null;
  if (pathname === '/averbacao') return 'averbacao';
  if (pathname.startsWith('/averbacao/')) return 'averbacao.detalhe';
  if (pathname.startsWith('/procuracoes')) return 'procuracoes';
  return null;
}
