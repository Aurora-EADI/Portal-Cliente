import { api } from "@/lib/api";

export interface InspectionUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface InspectionPhoto {
  id: string;
  url: string | null;
  fileName: string;
  itemId?: string | null;
  sideLabel?: string | null;
}

export interface InspectionItem {
  id: string;
  nome: string;
  posicao: string | null;
  status: string | null;
  avarias: string[];
  observacao: string | null;
  sideId: string;
  fotos?: InspectionPhoto[];
}

export interface InspectionSide {
  id: string;
  lado: string;
  inspecionado: boolean;
  inspectionId: string;
  itens: InspectionItem[];
}

export type Inspecao717Status = 'C' | 'NC' | 'NA';

export interface Inspecao717Item {
  numero: number;
  nome: string;
  status?: Inspecao717Status;
  observacao?: string;
}

export interface Inspecao717Group {
  tipo: 'veiculo_17' | 'container_7';
  itens: Inspecao717Item[];
  descricaoNaoConformidade?: string;
  concluido: boolean;
}

export interface Inspecao717Header {
  tipoCarga?: string;
  tipoVeiculo?: string;
  containerRefrigerado?: boolean;
  carcacaVentiladorOk?: boolean;
  observacao717?: string;
}

export interface Inspection {
  id: string;
  tipoOperacao: string;
  statusContainer: string;
  containerNumero: string;
  containerType: string;
  destino: string | null;
  origem: string | null;
  transportadora: string | null;
  condicaoContainer: string | null;
  lacre: string | null;
  motorista: string;
  cpf: string;
  placaCavalo: string;
  placaPrancha: string | null;
  beneficiario: string | null;
  dataHora: string;
  localizacaoArmazenagem: string | null;
  observacaoGeral: string | null;
  assinatura: string | null;
  gpsLat: number | null;
  gpsLng: number | null;
  inspectionStatus: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  user?: InspectionUser;
  lados?: InspectionSide[];
  fotos?: InspectionPhoto[];
  inspecao717?: Inspecao717Group[];
  inspecao717Header?: Inspecao717Header;
}

export interface PendingContainer {
  entryNumber: number;
  entryDate: string;
  exitDate?: string;
  status: string;
  tipoEntrada: string;
  carrier: string;
  abreviatura?: string;
  licensePlate?: string;
  licensePlateBoogie?: string;
  containerNumber: string;
  lacre?: string;
  beneficiario?: string;
  motorista?: string;
  cpfMotorista?: string;
  tempoPermanencia: number;
  priority: 'low' | 'medium' | 'high';
}

export interface ContainerEntry {
  id: string;
  entryNumber: number;
  entryDate: string;
  exitDate?: string | null;
  status: string;
  tipoEntrada: string;
  carrier: string;
  abreviatura?: string | null;
  licensePlate?: string | null;
  licensePlateBoogie?: string | null;
  containerNumber: string;
  lacre?: string | null;
  beneficiario?: string | null;
  motorista?: string | null;
  cpfMotorista?: string | null;
  tempoPermanencia: number;
  priority: 'low' | 'medium' | 'high';
  containerStatus: 'pending' | 'in_progress' | 'completed';
  firstSeenAt: string;
  lastSyncAt: string;
}

export interface ContainerEntriesParams {
  page?: number;
  limit?: number;
  search?: string;
  containerStatus?: string;
  startDate?: string;
  endDate?: string;
}

export interface PaginatedContainerEntriesResponse {
  data: ContainerEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface PaginatedInspectionsResponse {
  data: Inspection[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface InspectionListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
}

export const inspectionsService = {
  async findAll(params?: InspectionListParams): Promise<PaginatedInspectionsResponse> {
    const response = await api.get("/portal/inspections", { params });
    return response.data;
  },

  async findOne(id: string): Promise<Inspection> {
    const response = await api.get(`/portal/inspections/${id}`);
    return response.data;
  },

  async findPendingContainers(filters?: {
    dtInicio?: string;
    dtFinal?: string;
    codTransp?: number;
  }): Promise<PendingContainer[]> {
    const response = await api.get('/portal/inspections/pending-containers', {
      params: filters,
    });
    return response.data;
  },

  async listContainerEntries(params?: ContainerEntriesParams): Promise<PaginatedContainerEntriesResponse> {
    const response = await api.get('/portal/inspections/container-entries', { params });
    return response.data;
  },
};
