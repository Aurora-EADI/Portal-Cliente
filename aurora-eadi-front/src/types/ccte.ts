export enum FlightStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
}

export enum CargoItemStatus {
  EM_ANALISE = 'EM_ANALISE',
  DTA_REGISTRADA = 'DTA_REGISTRADA',
  ENVIADO = 'ENVIADO',
}

export enum TCOptions {
  P = 'P',
  A = 'A',
}

export enum WarehouseReason {
  CV = 'CV',
  MA = 'MA',
  RF = 'RF',
  DOC = 'DOC',
  DIV = 'DIV',
  MT = 'MT',
  P = 'P',
}

export enum FlightHistoryType {
  EDIT = 'EDIT',
  REVERT = 'REVERT',
}

export interface Flight {
  id: string;
  aircraftName: string;
  arrivalDate: string;
  arrivalTime: string;
  flightCode: string;
  termoEntrada: string;
  status: FlightStatus;
  createdAt: string;
  updatedAt: string;
  cargoItems?: CargoItem[];
  history?: FlightHistoryRecord[];
  dtaFilledCount?: number;
  _count?: {
    cargoItems: number;
  };
}

export interface CargoItem {
  id: string;
  flightId: string;
  house: string;
  importer: string;
  dta: string;
  tc: TCOptions;
  warehouseReason?: WarehouseReason | null;
  status: CargoItemStatus;
  responsible: string;
  observations: string;
  sent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FlightHistoryRecord {
  id: string;
  flightId: string;
  type: FlightHistoryType;
  changes: string;
  reason: string;
  createdAt: string;
}

export interface CreateFlightDto {
  aircraftName: string;
  arrivalDate: string;
  arrivalTime: string;
  flightCode: string;
  termoEntrada: string;
}

export interface UpdateFlightDto {
  aircraftName?: string;
  arrivalDate?: string;
  arrivalTime?: string;
  flightCode?: string;
  termoEntrada?: string;
  reason: string;
}

export interface CargoItemInput {
  house: string;
  importer: string;
  dta?: string;
  tc: TCOptions;
  warehouseReason?: WarehouseReason;
  responsible?: string;
  observations?: string;
}

export interface CreateCargoItemsDto {
  items: CargoItemInput[];
}

export interface UpdateCargoItemDto {
  house?: string;
  importer?: string;
  dta?: string;
  tc?: TCOptions;
  warehouseReason?: WarehouseReason;
  responsible?: string;
  observations?: string;
  sent?: boolean;
  status?: CargoItemStatus;
}

export interface RevertFlightDto {
  reason: string;
}
