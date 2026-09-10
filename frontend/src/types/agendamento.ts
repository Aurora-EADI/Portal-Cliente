export interface DI {
  id: string;
  numeroDI: string;
  cliente: string;
  container: string;
  tipoContainer: string;
  status: 'liberada' | 'bloqueada' | 'retirado';
  pesoBruto: number;
  mercadoria: string;
  transportadora: string;
  // Campos extras vindos da DiAverbada (rota /agendamento/dis)
  nLote?: string;
  nConhecimento?: string;
  dta?: string;
  modalidade?: string;
  cnpjCliente?: string;
  codDespachante?: string;
  despachante?: string;
  localizacao?: string;
  averbadoEm?: string;
  /**
   * Situação da procuração deste despachante para o importador da DI.
   * Só vem preenchido para DESPACHANTE; `null` = não existe procuração.
   * Qualquer valor diferente de APROVADA bloqueia operar em nome do cliente.
   * `VENCIDA` é derivado: aprovada, mas com a validade já passada.
   */
  procuracaoStatus?:
    | 'PENDENTE_ENVIO'
    | 'EM_ANALISE'
    | 'APROVADA'
    | 'REPROVADA'
    | 'VENCIDA'
    | null;
  /**
   * Situação do processo documental de averbação desta DI.
   * `null` = não há processo, e o fluxo legado vale — a DI já veio averbada
   * do Portal Aurora. Só bloqueia quando há processo ainda não liberado.
   */
  averbacaoStatus?:
    | 'RASCUNHO'
    | 'EM_ANALISE'
    | 'PENDENTE_CORRECAO'
    | 'LIBERADO_AGENDAMENTO'
    | null;
}

export interface Motorista {
  id: string;
  nome: string;
  cpf: string;
  cnh: string;
  telefone: string;
}

export interface Veiculo {
  id: string;
  placa: string;
  modelo: string;
  tipo: string;
}

export interface Transportadora {
  id: string;
  nome: string;
  cnpj?: string;
  telefone?: string;
  email?: string | null;
  whatsapp?: string | null;
}

export type AgendamentoStatus = 'ATIVO' | 'CANCELADO' | 'CHEGOU' | 'NO_SHOW' | 'ON_TIME' | 'ATRASADO' | 'AG_CHEGADA' | 'CONCLUIDO';

export interface Agendamento {
  id: string;
  diId: string;
  diNumero: string;
  diCliente: string;
  container: string;
  motorista: Motorista;
  veiculo: Veiculo;
  data: string;
  horario: string;
  protocolo: string;
  status: AgendamentoStatus;
  observacao?: string;
  criadoEm: string;
  operacao?: string;
  subOperacao?: string;
  cargaEspecial?: boolean;
  servicos?: string[];
  empresa?: string;
  awbMawb?: string | string[];
  dta?: string | string[];
  hawb?: string | string[];
  di?: string | string[];
  numeroVoo?: string;
  volumes?: string;
  peso?: string;
  consignatario?: string;
  transportadora?: string;
  prioridade?: string;
  criadoPorNome?: string;
  criadoPorRole?: string;
  cnpjCliente?: string;
  enderecoCliente?: string;
  telefoneCliente?: string;
  emailCliente?: string;
  cnpjTransportadora?: string;
  enderecoTransportadora?: string;
  telefoneTransportadora?: string;
  emailTransportadora?: string;
}

export interface HorarioSlot {
  horario: string;
  vagasTotais: number;
  vagasDisponiveis: number;
}

export interface JanelaAtendimento {
  id: string;
  descricao: string;
  horaInicio: string;
  horaFim: string;
  intervaloMinutos: number;
  vagasSimultaneas: number;
}
