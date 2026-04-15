import { api } from '@/lib/api';
import { AgendaFilters, AgendaResponse, PreRegistroVisitante, VisitanteStatus } from '@/types/visitantes';

const BASE = '/visitantes';

export const agendaService = {
  async findAll(filters?: AgendaFilters): Promise<AgendaResponse> {
    const params = new URLSearchParams();
    if (filters?.nome) params.append('nome', filters.nome);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.data) params.append('data', filters.data);
    if (filters?.dataInicio) params.append('dataInicio', filters.dataInicio);
    if (filters?.dataFim) params.append('dataFim', filters.dataFim);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await api.get(`${BASE}?${params.toString()}`);
    return response.data;
  },

  async findOne(id: string): Promise<PreRegistroVisitante> {
    const response = await api.get(`${BASE}/${id}`);
    return response.data;
  },

  async updateStatus(id: string, status: VisitanteStatus): Promise<PreRegistroVisitante> {
    const response = await api.patch(`${BASE}/${id}/status`, { status });
    return response.data;
  },
};
