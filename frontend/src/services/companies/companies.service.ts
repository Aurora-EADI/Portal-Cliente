import { api } from '@/lib/api';
import type { Company } from '@/types/company';

export interface PaginatedCompaniesResponse {
  data: Company[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export const companiesService = {
  findActive: async (params?: { limit?: number; page?: number }): Promise<PaginatedCompaniesResponse> => {
    try {
      const response = await api.get('/companies/active', { params });
      return response.data;
    } catch {
      return { data: [], pagination: { page: 1, limit: 100, total: 0, totalPages: 0, hasNext: false, hasPrev: false } };
    }
  },
};
