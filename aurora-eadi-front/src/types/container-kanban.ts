export enum ContainerStatus {
  FULL = "FULL",
  IN_PROCESS = "IN_PROCESS",
  EMPTY = "EMPTY"
}

export enum ContainerType {
  RECEBIMENTO = "RECEBIMENTO",
  RETIRADA = "RETIRADA",
  SERVICOS = "SERVIÇOS"
}

export interface ContainerCard {
  id: string;
  entryNumber: string;
  containerNumber: string;
  containerType: ContainerType;
  status: ContainerStatus;
  entryDate: string;
  exitDate: string | null;
  carrier: string;
  licensePlate: string;
  company: string;
  motorista: string;
  abreviatura: string;
  tempoMinutos: number | null; // tempo em minutos da API (tempo_p)
}

/**
 * Classificação por tempo do processo
 * 0-90 min: Normal (branco)
 * 91-120 min: Alerta (amarelo)
 * 121+ min: Crítico (vermelho)
 */
export type TimeClassification = "normal" | "alert" | "critical";

export function getTimeClassification(minutes: number | null): TimeClassification {
  if (minutes === null) return "normal";
  if (minutes <= 90) return "normal";
  if (minutes <= 120) return "alert";
  return "critical";
}

export interface KanbanColumn {
  id: ContainerStatus;
  title: string;
  color: string;
  containers: ContainerCard[];
}

export interface KanbanFilters {
  search: string;
  entryNumbers: string[];
  documento: string;
  containerType: ContainerType | "";
  status: ContainerStatus | "";
  company: string;
  dateFrom: string;
  dateTo: string;
}
