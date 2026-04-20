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
};
