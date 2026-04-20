import { useMemo } from "react";
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

  const query = useQuery<ContainerCard[], Error>({
    queryKey: KANBAN_QUERY_KEYS.containers(filters),
    queryFn: () => getKanbanContainers(filters),
    refetchInterval,
    enabled,
    staleTime: 30000,
  });

  // Deriva as colunas do Kanban a partir dos containers com useMemo para estabilidade
  const columns: KanbanColumn[] = useMemo(() => {
    if (!query.data) return [];

    return [
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
    ];
  }, [query.data]);

  // Extrai listas únicas para filtros com useMemo
  const companies = useMemo(() =>
    query.data ? getUniqueCompaniesFromContainers(query.data) : [],
    [query.data]
  );

  const carriers = useMemo(() =>
    query.data ? getUniqueCarriersFromContainers(query.data) : [],
    [query.data]
  );

  return {
    containers: query.data ?? [],
    columns,
    companies,
    carriers,
    isLoading: query.isLoading,
    isPending: query.isPending, // V5 compatibility
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isFetching: query.isFetching,
  };
}
