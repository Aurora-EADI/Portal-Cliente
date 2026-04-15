export enum VisitanteStatus {
  AGENDADO = 'AGENDADO',
  PRESENTE = 'PRESENTE',
  NAO_COMPARECEU = 'NAO_COMPARECEU',
}

export interface PreRegistroVisitante {
  id: string;
  nome: string;
  name?: string;
  cpf: string;
  rg?: string;
  telefone?: string;
  motivo?: string;
  horarioPrevisto?: string;
  status: VisitanteStatus;
  endereco?: string;
  bairro?: string;
  numero?: string;
  cep?: string;
  cidade?: string;
  estado?: string;
  funcao?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AgendaFilters {
  nome?: string;
  status?: VisitanteStatus;
  data?: string;
  dataInicio?: string;
  dataFim?: string;
  page?: number;
  limit?: number;
}

export interface AgendaResponse {
  data: PreRegistroVisitante[];
  total: number;
}
