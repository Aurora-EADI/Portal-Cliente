import { api } from '@/lib/api';
import {
  AuditLogListResponse,
  AuditLogQueryParams,
  WarehouseAuditLog,
} from '@/types/armazem-geral';

const BASE_PATH = '/armazem-geral/audit-logs';

export const auditService = {
  findAll: async (params?: AuditLogQueryParams): Promise<AuditLogListResponse> => {
    const response = await api.get(BASE_PATH, { params });
    return response.data;
  },

  findOne: async (id: string): Promise<WarehouseAuditLog> => {
    const response = await api.get(`${BASE_PATH}/${id}`);
    return response.data;
  },
};
