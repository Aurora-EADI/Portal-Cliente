// ============================================
// TIPOS: SERVIÇOS DO SIMULADOR MARÍTIMO
// ============================================

export enum ServiceCalculationType {
  FIXED = 'FIXED', // Valor fixo (ex: R$ 500,00)
  PERCENTAGE_CIF = 'PERCENTAGE_CIF', // Percentual sobre CIF BRL (ex: 0,35%)
  PER_CONTAINER = 'PER_CONTAINER', // Valor por container (ex: R$ 350 × qtd)
  PER_TONNE = 'PER_TONNE', // Valor por tonelada (ex: R$ 25 × toneladas)
}

export interface Service {
  id: string;
  code: string; // Ex: "SRV-001"
  name: string; // Ex: "Armazenagem"
  description?: string;
  category?: string; // Ex: "Operacional", "Logística"
  calculationType: ServiceCalculationType; // Tipo de cálculo do serviço
  formulaExpression?: string; // Fórmula para exibição (ex: "0.35% do CIF", "R$ 350/container")
  isActive: boolean;
  hasStripping: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceCost {
  id: string;
  serviceId: string;
  cost: number; // TAXA base (não valor final): 0.35 para %, 350 para valor fixo/unidade
  validFrom: string; // ISO Date
  validUntil?: string | null; // null = vigente
  createdBy: string;
  reason?: string;
  createdAt: string;
  service?: {
    code: string;
    name: string;
    calculationType?: ServiceCalculationType;
  };
  user?: {
    name: string;
    email: string;
  };
}

export interface ServiceWithCurrentCost extends Service {
  currentCost?: ServiceCost;
}

// DTOs
export interface CreateServiceDto {
  code: string;
  name: string;
  description?: string;
  category?: string;
  calculationType: ServiceCalculationType;
  formulaExpression?: string;
  isActive?: boolean;
  hasStripping?: boolean;
}

export interface UpdateServiceDto extends Partial<CreateServiceDto> { }

export interface CreateServiceCostDto {
  serviceId: string;
  cost: number;
  validFrom?: string;
  validUntil?: string;
  reason?: string;
}
