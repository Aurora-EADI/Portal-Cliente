import { api } from '@/lib/api';
import {
  WarehouseDashboardDemurrageResponse,
  WarehouseDashboardKpis,
  WarehouseDashboardOverview,
  WarehouseDashboardPatioDistribution,
  WarehouseDashboardTopCustomerItem,
  WarehouseDashboardTransshipmentsMonthly,
} from '@/types/armazem-geral';

const BASE_PATH = '/armazem-geral/dashboard';

export const dashboardService = {
  getOverview: async (): Promise<WarehouseDashboardOverview> => {
    const response = await api.get(`${BASE_PATH}/overview`);
    return response.data;
  },

  getKpis: async (params?: { year?: number; month?: number; customerIds?: string[] }): Promise<WarehouseDashboardKpis> => {
    const response = await api.get(`${BASE_PATH}/kpis`, { params });
    return response.data;
  },

  getTopCustomers: async (params?: { limit?: number; customerIds?: string[] }): Promise<WarehouseDashboardTopCustomerItem[]> => {
    const response = await api.get(`${BASE_PATH}/top-customers`, { params });
    return response.data;
  },

  getPatioDistribution: async (params?: { customerIds?: string[] }): Promise<WarehouseDashboardPatioDistribution> => {
    const response = await api.get(`${BASE_PATH}/patio-distribution`, { params });
    return response.data;
  },

  getTransshipmentsMonthly: async (
    params?: { months?: number; customerIds?: string[] },
  ): Promise<WarehouseDashboardTransshipmentsMonthly> => {
    const response = await api.get(`${BASE_PATH}/transshipments-monthly`, { params });
    return response.data;
  },

  getDemurrage: async (
    params?: { days?: number; limit?: number },
  ): Promise<WarehouseDashboardDemurrageResponse> => {
    const response = await api.get(`${BASE_PATH}/demurrage`, { params });
    return response.data;
  },
};
