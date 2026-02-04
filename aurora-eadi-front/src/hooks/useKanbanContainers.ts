import { useQuery } from "@tanstack/react-query";
import { ContainerCard, ContainerStatus, KanbanColumn } from "@/types";
import {
  getKanbanContainers,
  getUniqueCompaniesFromContainers,
  getUniqueCarriersFromContainers,
} from "@/services/kanban/kanban.service";
import { KanbanFiltersDTO } from "@/services/kanban/types";

export const KANBAN_QUERY_KEYS = {
  all: ["kanban"] as const,
  containers: (filters?: KanbanFiltersDTO) =>
    [...KANBAN_QUERY_KEYS.all, "containers", filters] as const,
};

interface UseKanbanContainersOptions {
  filters?: KanbanFiltersDTO;
  refetchInterval?: number;
  enabled?: boolean;
}

/**
 * Hook para buscar containers do Kanban
 */
export function useKanbanContainers(options: UseKanbanContainersOptions = {}) {
  const { filters, refetchInterval = 60000, enabled = true } = options;

  const query = useQuery({
    queryKey: KANBAN_QUERY_KEYS.containers(filters),
    queryFn: () => getKanbanContainers(filters),
    refetchInterval,
    enabled,
    staleTime: 30000,
  });

  // Deriva as colunas do Kanban a partir dos containers
  const columns: KanbanColumn[] = query.data
    ? [
        {
          id: ContainerStatus.FULL,
          title: "Container Cheio",
          color: "bg-blue-500",
          containers: query.data.filter((c) => c.status === ContainerStatus.FULL),
        },
        {
          id: ContainerStatus.IN_PROCESS,
          title: "Em Processo",
          color: "bg-amber-500",
          containers: query.data.filter(
            (c) => c.status === ContainerStatus.IN_PROCESS
          ),
        },
        {
          id: ContainerStatus.EMPTY,
          title: "Containers Vazios",
          color: "bg-green-500",
          containers: query.data.filter((c) => c.status === ContainerStatus.EMPTY),
        },
      ]
    : [];

  // Extrai listas únicas para filtros
  const companies = query.data
    ? getUniqueCompaniesFromContainers(query.data)
    : [];

  const carriers = query.data
    ? getUniqueCarriersFromContainers(query.data)
    : [];

  return {
    containers: query.data ?? [],
    columns,
    companies,
    carriers,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isFetching: query.isFetching,
  };
}
