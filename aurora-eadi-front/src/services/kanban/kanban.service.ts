import { api } from "@/lib/api";
import { ContainerCard } from "@/types";
import {
  KanbanAPIResponse,
  KanbanFiltersDTO,
  mapAPIResponseToContainerCard,
} from "./types";

/**
 * Busca containers do Kanban
 */
export async function getKanbanContainers(
  filters?: KanbanFiltersDTO
): Promise<ContainerCard[]> {
  try {
    const { data } = await api.get<KanbanAPIResponse[]>("/kanban", {
      params: filters,
    });

    return data.map((item, index) => mapAPIResponseToContainerCard(item, index));
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string | string[] } } };
    const backendMessage = err.response?.data?.message;
    let message = "Erro ao buscar containers do Kanban";

    if (typeof backendMessage === "string") {
      message = backendMessage;
    } else if (Array.isArray(backendMessage)) {
      message = backendMessage.join(", ");
    }

    return Promise.reject(new Error(message));
  }
}

/**
 * Extrai lista única de empresas dos containers
 */
export function getUniqueCompaniesFromContainers(
  containers: ContainerCard[]
): string[] {
  return [...new Set(containers.map((c) => c.company))].filter(Boolean).sort();
}

/**
 * Extrai lista única de transportadoras dos containers
 */
export function getUniqueCarriersFromContainers(
  containers: ContainerCard[]
): string[] {
  return [...new Set(containers.map((c) => c.carrier))].filter(Boolean).sort();
}
