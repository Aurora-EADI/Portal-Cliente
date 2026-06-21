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
