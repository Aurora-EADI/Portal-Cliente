// ============================================
// TIPOS: SIMULAÇÕES AÉREAS
// ============================================

import { ServiceCostType, SimulationStatus, SimulationService } from './simulation';

// Tipo para representar dados retornados do backend (formato unificado de versão)
export interface AirSimulation {
  id: string; // ID da versão
  simulationId?: string; // ID da capa (Simulation)
  simulationNumber: string; // Ex: "AIR-20241215-0001"
  version: number;
  displayNumber: string; // Ex: "AIR-001-V1"
  baseVersionId?: string | null;
  isCurrentVersion: boolean;
  versionReason?: string | null;

  // Dados do cliente
  customerId: string;

  // Dados da carga aérea
  cifUsd: number;
  dollarRate: number;
  cifBrl: number;
  weightKg?: number | null; // Peso bruto em KG
  volumeM3?: number | null; // Volume em M³

  // Custos adicionais
  storageCost?: number | null;
  transportCost?: number | null;
  discount?: number | null;

  // Totalizadores
  totalServices?: number | null;
  totalGeneral?: number | null;

  // Status e controle
  status: SimulationStatus;
  minBillingValue: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;

  // Relacionamentos
  customer?: {
    id: string;
    code: string;
    name: string;
    document: string;
  };
  user?: {
    id: string;
    name: string;
    email?: string;
  };
  services?: SimulationService[];
  // Para lista de simulações (quando retorna a capa com versões aninhadas)
  versions?: AirSimulationVersionSummary[];
  _count?: {
    services: number;
  };
}

export interface AirSimulationVersionSummary {
  id: string;
  version: number;
  displayNumber: string;
  isCurrentVersion: boolean;
  status: SimulationStatus;
  totalGeneral: number;
  createdAt: string;
  user?: {
    id: string;
    name: string;
  };
  _count?: {
    services: number;
  };
}

// DTOs
export interface CreateAirSimulationDto {
  customerId: string;
  cifUsd: number;
  dollarRate: number;
  weightKg?: number;
  volumeM3?: number;
  storageCost?: number;
  transportCost?: number;
  discount?: number;
  minBillingValue?: number;
  initialServices?: AddAirSimulationServiceDto[];
}

export interface UpdateAirSimulationDto extends Partial<CreateAirSimulationDto> {
  status?: SimulationStatus;
}

export interface CreateAirNewVersionDto extends CreateAirSimulationDto {
  baseSimulationId: string;
  versionReason?: string;
}

export interface AddAirSimulationServiceDto {
  serviceId: string;
  costType: ServiceCostType;
  originalCost?: number;
  appliedCost?: number;
  customReason?: string;
}
