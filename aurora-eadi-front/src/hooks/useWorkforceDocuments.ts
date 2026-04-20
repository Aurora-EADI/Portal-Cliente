import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  requirementRulesService,
  workforceDocumentService,
  WorkforceDocumentRequirementDto,
} from '@/services/api';
import { DocumentStatus } from '@/types';

const WORKFORCE_DOCS_KEY = ['workforce-documents'];
const WORKFORCE_REQS_KEY = ['workforce-document-requirements'];

export const useWorkforceRequirements = () => {
  return useQuery({
    queryKey: [...WORKFORCE_REQS_KEY, 'global'],
    queryFn: async (): Promise<WorkforceDocumentRequirementDto[]> =>
      requirementRulesService.getGlobalWorkforceRequirements(),
  });
};

export const useWorkforceDocuments = (employeeId?: string, latestOnly = false) => {
  return useQuery({
    queryKey: [...WORKFORCE_DOCS_KEY, employeeId, latestOnly],
    queryFn: async () => workforceDocumentService.listByEmployee(String(employeeId), latestOnly),
    enabled: !!employeeId,
  });
};

export const useWorkforceMissingDocuments = (employeeId?: string) => {
  return useQuery({
    queryKey: [...WORKFORCE_DOCS_KEY, 'missing', employeeId],
    queryFn: async () => workforceDocumentService.listMissingByEmployee(String(employeeId)),
    enabled: !!employeeId,
  });
};

export const useUploadWorkforceDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: workforceDocumentService.upload,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [...WORKFORCE_DOCS_KEY, variables.companyEmployeeId],
      });
      queryClient.invalidateQueries({
        queryKey: [...WORKFORCE_DOCS_KEY, 'missing', variables.companyEmployeeId],
      });
    },
  });
};

export const useUpdateWorkforceDocumentStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
      rejectionReason,
      employeeId,
    }: {
      id: string;
      status: DocumentStatus;
      rejectionReason?: string;
      employeeId: string;
    }) => {
      return workforceDocumentService.updateStatus(id, status, rejectionReason);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [...WORKFORCE_DOCS_KEY, variables.employeeId],
      });
      queryClient.invalidateQueries({
        queryKey: [...WORKFORCE_DOCS_KEY, 'missing', variables.employeeId],
      });
      // Invalidate the main workforce list and metrics
      queryClient.invalidateQueries({
        queryKey: ['workforce'],
      });
    },
  });
};
