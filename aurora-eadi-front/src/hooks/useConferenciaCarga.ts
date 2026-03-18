import { useQuery } from "@tanstack/react-query";
import { ConferenciaCargaItem } from "@/types";
import { getConferenciaCargaOpen } from "@/services/conferencia-carga";

export const CONFERENCIA_CARGA_QUERY_KEYS = {
  all: ["conferencia-carga"] as const,
  open: () => [...CONFERENCIA_CARGA_QUERY_KEYS.all, "open"] as const,
};

export function useConferenciaCargaOpen(options?: {
  refetchInterval?: number;
  enabled?: boolean;
}) {
  const { refetchInterval = 60000, enabled = true } = options ?? {};

  const query = useQuery<ConferenciaCargaItem[], Error>({
    queryKey: CONFERENCIA_CARGA_QUERY_KEYS.open(),
    queryFn: () => getConferenciaCargaOpen(),
    refetchInterval,
    enabled,
    staleTime: 30000,
  });

  return {
    items: query.data ?? [],
    isLoading: query.isLoading,
    isPending: query.isPending,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isFetching: query.isFetching,
  };
}

