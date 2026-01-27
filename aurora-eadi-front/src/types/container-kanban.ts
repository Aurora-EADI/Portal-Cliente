export enum ContainerStatus {
  FULL = "FULL",
  IN_PROCESS = "IN_PROCESS",
  EMPTY = "EMPTY"
}

export enum ContainerType {
  DRY_20 = "20' Dry",
  DRY_40 = "40' Dry",
  DRY_40HC = "40' HC",
  REEFER_20 = "20' Reefer",
  REEFER_40 = "40' Reefer",
  OPEN_TOP_20 = "20' Open Top",
  OPEN_TOP_40 = "40' Open Top",
  FLAT_RACK_20 = "20' Flat Rack",
  FLAT_RACK_40 = "40' Flat Rack",
  TANK = "Tank"
}

export interface ContainerCard {
  id: string;
  containerNumber: string;
  containerType: ContainerType;
  status: ContainerStatus;
  client: string;
  vessel: string;
  arrivalDate: string;
  releaseDate: string | null;
  grossWeight: number;
  diNumber: string;
  location: string;
  bl: string;
  origin: string;
  destination: string;
  priority: "low" | "medium" | "high" | "urgent";
}

export interface KanbanColumn {
  id: ContainerStatus;
  title: string;
  color: string;
  containers: ContainerCard[];
}

export interface KanbanFilters {
  search: string;
  containerType: ContainerType | "";
  client: string;
  dateFrom: string;
  dateTo: string;
  priority: "low" | "medium" | "high" | "urgent" | "";
}
