// ============================================
// TIPOS: SIMULAÇÕES MARÍTIMAS
// ============================================

import { Service } from './service';

export enum SimulationStatus {
  DRAFT = 'DRAFT',
  APPROVED = 'APPROVED',
  SENT = 'SENT',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
}

export enum ServiceCostType {
  DEFAULT = 'DEFAULT',
  CUSTOM = 'CUSTOM',
  ZEROED = 'ZEROED',
}

export interface Simulation {
  id: string;
  simulationNumber: string; // Ex: "SIM-20241215-0001"
  version: number;
  displayNumber: string; // Ex: "SIM-001-V1"
  baseSimulationId?: string | null;
  isCurrentVersion: boolean;
  versionReason?: string | null;

  // Dados do cliente
  supplierId: string;

  // Dados da carga
  cifUsd: number;
  dollarRate: number;
  cifBrl: number;
  tonnes?: number | null;
  cntrCount?: number | null;
  cntrType?: string | null;

  // Custos adicionais
  storageCost?: number | null;
  transportCost?: number | null;
  discount?: number | null;

  // Totalizadores
  totalServices?: number | null;
  totalGeneral?: number | null;

  // Status e controle
  status: SimulationStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;

  // Relacionamentos
  supplier?: {
    id: string;
    fantasyName?: string;
    socialReason: string;
    cnpj: string;
  };
  user?: {
    id: string;
    name: string;
    email: string;
  };
  services?: SimulationService[];
  _count?: {
    services: number;
  };
}

export interface SimulationService {
  id: string;
  simulationId: string;
  serviceId: string;
  costType: ServiceCostType;
  originalCost: number; // Custo da tabela no momento
  appliedCost: number; // Custo aplicado na simulação
  customReason?: string | null;
  createdAt: string;
  updatedAt: string;
  service?: {
    code: string;
    name: string;
    category?: string;
  };
}

// DTOs
export interface CreateSimulationDto {
  supplierId: string;
  cifUsd: number;
  dollarRate: number;
  tonnes?: number;
  cntrCount?: number;
  cntrType?: string;
  storageCost?: number;
  transportCost?: number;
  discount?: number;
}

export interface UpdateSimulationDto extends Partial<CreateSimulationDto> {
  status?: SimulationStatus;
}

export interface CreateNewVersionDto extends CreateSimulationDto {
  baseSimulationId: string;
  versionReason?: string;
}

export interface AddSimulationServiceDto {
  serviceId: string;
  costType: ServiceCostType;
  appliedCost: number;
  customReason?: string;
}
