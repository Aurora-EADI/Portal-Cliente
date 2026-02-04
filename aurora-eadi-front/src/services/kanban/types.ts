import { ContainerCard, ContainerStatus, ContainerType } from "@/types";

/**
 * Resposta da API do Kanban (formato do backend)
 */
export interface KanbanAPIResponse {
  entryNumber: string;
  entryDate: string;
  exitDate: string | null;
  status: string; // "RECEBIMENTO" | "RETIRADA" | "SERVIÇOS"
  carrier: string;
  abreviatura: string | null; // abreviatura do documento
  licensePlate: string;
  containerNumber: string | null;
  beneficiario: string | null;
  motorista: string | null;
  tempo_p: number | null; // tempo em minutos
}

/**
 * Parâmetros de filtro para a API
 */
export interface KanbanFiltersDTO {
  dtInicio?: string;
  dtFinal?: string;
  flagTipo?: number; // 0=todos, 1=recebimento, 2=retirada, 3=serviços
  codTransp?: number;
}

/**
 * Mapeia o status da API para ContainerType do frontend
 */
function mapContainerType(apiStatus: string): ContainerType {
  switch (apiStatus) {
    case "RECEBIMENTO":
      return ContainerType.RECEBIMENTO;
    case "RETIRADA":
      return ContainerType.RETIRADA;
    case "SERVIÇOS":
      return ContainerType.SERVICOS;
    default:
      return ContainerType.RECEBIMENTO;
  }
}

/**
 * Deriva o status do container baseado em exitDate
 */
function deriveContainerStatus(exitDate: string | null): ContainerStatus {
  if (exitDate === null) {
    return ContainerStatus.IN_PROCESS;
  }
  return ContainerStatus.EMPTY;
}

/**
 * Transforma resposta da API para o formato do frontend
 */
export function mapAPIResponseToContainerCard(
  item: KanbanAPIResponse,
  index: number
): ContainerCard {
  return {
    id: item.entryNumber || String(index + 1),
    entryNumber: item.entryNumber,
    containerNumber: item.containerNumber || "-",
    containerType: mapContainerType(item.status),
    status: deriveContainerStatus(item.exitDate),
    entryDate: item.entryDate,
    exitDate: item.exitDate,
    carrier: item.carrier || "N/A",
    licensePlate: item.licensePlate || "N/A",
    company: item.beneficiario || "N/A",
    motorista: item.motorista || "N/A",
    abreviatura: item.abreviatura || "N/A",
    tempoMinutos: item.tempo_p ?? null,
  };
}
