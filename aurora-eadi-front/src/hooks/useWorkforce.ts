import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { EmployeeStatus } from '@/types';
import { CompanyWorkforceEmployeeDto, PaginationParams, requirementRulesService } from '@/services/api';

const WORKFORCE_KEY = ['workforce'];

export const useWorkforce = (params?: PaginationParams & { companyId?: string }) => {
  return useQuery({
    queryKey: [...WORKFORCE_KEY, params],
    queryFn: async () => requirementRulesService.listWorkforce(params),
  });
};

export const useWorkforceDetails = (id?: string) => {
  return useQuery({
    queryKey: [...WORKFORCE_KEY, 'details', id],
    queryFn: async () => requirementRulesService.getWorkforceById(String(id)),
    enabled: !!id,
  });
};

export const useUpdateWorkforceStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: EmployeeStatus }) => {
      return requirementRulesService.updateWorkforceStatus(id, status);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: WORKFORCE_KEY });
      queryClient.invalidateQueries({ queryKey: [...WORKFORCE_KEY, 'details', variables.id] });
    },
  });
};

export const useCreateWorkforceEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      companyId,
      employee,
    }: {
      companyId: string;
      employee: CompanyWorkforceEmployeeDto;
    }) => {
      const currentEmployees = await requirementRulesService.getCompanyWorkforce(companyId);

      return requirementRulesService.updateCompanyWorkforce(companyId, [
        ...currentEmployees.map((item) => ({
          fullName: item.fullName,
          cpf: item.cpf,
          position: item.position,
          hiredAt: item.hiredAt,
          status: item.status,
        })),
        {
          fullName: employee.fullName,
          cpf: employee.cpf,
          position: employee.position,
          hiredAt: employee.hiredAt,
          status: employee.status ?? EmployeeStatus.ACTIVE,
        },
      ]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORKFORCE_KEY });
    },
  });
};

export const useUpdateWorkforceEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      companyId,
      employeeId,
      employee,
    }: {
      companyId: string;
      employeeId: string;
      employee: CompanyWorkforceEmployeeDto;
    }) => {
      const currentEmployees = await requirementRulesService.getCompanyWorkforce(companyId);

      return requirementRulesService.updateCompanyWorkforce(
        companyId,
        currentEmployees.map((item) => {
          if (item.id !== employeeId) {
            return {
              fullName: item.fullName,
              cpf: item.cpf,
              position: item.position,
              hiredAt: item.hiredAt,
              status: item.status,
            };
          }

          return {
            fullName: employee.fullName,
            cpf: employee.cpf,
            position: employee.position,
            hiredAt: employee.hiredAt,
            status: employee.status ?? item.status ?? EmployeeStatus.ACTIVE,
          };
        }),
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: WORKFORCE_KEY });
      queryClient.invalidateQueries({
        queryKey: [...WORKFORCE_KEY, 'details', variables.employeeId],
      });
    },
  });
};
