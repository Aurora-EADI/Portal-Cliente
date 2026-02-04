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

// Tipo para representar dados retornados do backend (formato unificado de versão)
export interface Simulation {
  id: string; // ID da versão
  simulationId?: string; // ID da capa (Simulation)
  simulationNumber: string; // Ex: "SIM-20241215-0001"
  version: number;
  displayNumber: string; // Ex: "SIM-001-V1"
  baseVersionId?: string | null;
  isCurrentVersion: boolean;
  versionReason?: string | null;

  // Dados do cliente
  customerId: string;

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
  auroraPeriods?: number;

  // Totalizadores
  totalServices?: number | null;
  totalGeneral?: number | null;

  // Status e controle
  status: SimulationStatus;
  hasStripping: boolean;
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
  versions?: SimulationVersionSummary[];
  _count?: {
    services: number;
  };
}

// Tipo para o item de serviço (agora é uma tabela real, não mais JSON)
export interface SimulationService {
  id: string;
  versionId: string;
  serviceId: string | null;
  serviceName: string;
  serviceCode: string;
  calculationType: string;
  hasStripping: boolean;
  costType: ServiceCostType;
  originalCost: number;
  appliedCost: number;
  customReason?: string | null;
  // Para compatibilidade com o formato aninhado
  service?: {
    id: string | null;
    code: string;
    name: string;
    calculationType: string;
    hasStripping: boolean;
  };
}

// Tipo para lista de simulações (header + versão corrente)
export interface SimulationListItem {
  id: string; // ID da capa
  simulationNumber: string;
  customerId: string;
  customer?: {
    id: string;
    code: string;
    name: string;
    document: string;
  };
  createdAt: string;
  updatedAt: string;
  versions?: SimulationVersionSummary[];
}

export interface SimulationVersionSummary {
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
export interface CreateSimulationDto {
  customerId: string;
  cifUsd: number;
  dollarRate: number;
  tonnes?: number;
  cntrCount?: number;
  cntrType?: string;
  storageCost?: number;
  transportCost?: number;
  discount?: number;
  hasStripping?: boolean;
  auroraPeriods?: number;
  minBillingValue?: number;
  initialServices?: AddSimulationServiceDto[];
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
  originalCost?: number;
  appliedCost?: number;
  customReason?: string;
}
