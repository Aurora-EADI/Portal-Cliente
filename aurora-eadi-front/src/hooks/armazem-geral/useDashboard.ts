import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/armazem-geral/dashboard.service';

export const DASHBOARD_KEYS = {
  all: ['warehouse-dashboard'] as const,
  overview: () => [...DASHBOARD_KEYS.all, 'overview'] as const,
  kpis: (params?: { year?: number; month?: number }) =>
    [...DASHBOARD_KEYS.all, 'kpis', params] as const,
  topCustomers: (params?: { limit?: number }) =>
    [...DASHBOARD_KEYS.all, 'top-customers', params] as const,
  patioDistribution: (params?: { customerIds?: string[] }) => [...DASHBOARD_KEYS.all, 'patio-distribution', params] as const,
  transshipmentsMonthly: (params?: { months?: number; customerIds?: string[] }) =>
    [...DASHBOARD_KEYS.all, 'transshipments-monthly', params] as const,
  demurrage: (params?: { days?: number; limit?: number; customerIds?: string[] }) =>
    [...DASHBOARD_KEYS.all, 'demurrage', params] as const,
};

export function useDashboardOverview(params?: { customerIds?: string[] }) {
  return useQuery({
    queryKey: DASHBOARD_KEYS.overview(), // Mantendo chave simples pois overview é global, ou podemos adicionar params se quiser filtrar
    queryFn: () => dashboardService.getOverview(),
  });
}

export function useDashboardKpis(params?: { year?: number; month?: number; customerIds?: string[] }) {
  return useQuery({
    queryKey: DASHBOARD_KEYS.kpis(params),
    queryFn: () => dashboardService.getKpis(params),
  });
}

export function useDashboardTopCustomers(params?: { limit?: number; customerIds?: string[] }) {
  return useQuery({
    queryKey: DASHBOARD_KEYS.topCustomers(params),
    queryFn: () => dashboardService.getTopCustomers(params),
  });
}

export function useDashboardPatioDistribution(params?: { customerIds?: string[] }) {
  return useQuery({
    queryKey: DASHBOARD_KEYS.patioDistribution(params),
    queryFn: () => dashboardService.getPatioDistribution(params),
  });
}

export function useDashboardTransshipmentsMonthly(params?: { months?: number; customerIds?: string[] }) {
  return useQuery({
    queryKey: DASHBOARD_KEYS.transshipmentsMonthly(params),
    queryFn: () => dashboardService.getTransshipmentsMonthly(params),
  });
}

export function useDashboardDemurrage(params?: { days?: number; limit?: number }) {
  return useQuery({
    queryKey: DASHBOARD_KEYS.demurrage(params),
    queryFn: () => dashboardService.getDemurrage(params),
  });
}
