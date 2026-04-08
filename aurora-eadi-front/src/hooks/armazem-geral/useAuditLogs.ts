import { useQuery } from '@tanstack/react-query';
import { auditService } from '@/services/armazem-geral/audit.service';
import { AuditLogQueryParams } from '@/types/armazem-geral';

export const AUDIT_LOG_KEYS = {
  all: ['audit-logs'] as const,
  list: (params: AuditLogQueryParams) => [...AUDIT_LOG_KEYS.all, 'list', params] as const,
  detail: (id: string) => [...AUDIT_LOG_KEYS.all, 'detail', id] as const,
};

export function useAuditLogsList(params: AuditLogQueryParams = {}) {
  return useQuery({
    queryKey: AUDIT_LOG_KEYS.list(params),
    queryFn: () => auditService.findAll(params),
  });
}

export function useAuditLogDetail(id: string) {
  return useQuery({
    queryKey: AUDIT_LOG_KEYS.detail(id),
    queryFn: () => auditService.findOne(id),
    enabled: !!id,
  });
}
