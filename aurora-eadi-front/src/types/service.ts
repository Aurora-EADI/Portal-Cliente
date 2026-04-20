// ============================================
// TIPOS: SERVIÇOS DO SIMULADOR (MARÍTIMO E AÉREO)
// ============================================

/**
 * Define em qual simulador o serviço deve aparecer
 */
export enum ServiceModal {
  AIR = 'AIR',
  MARITIME = 'MARITIME',
  BOTH = 'BOTH',
}

/**
 * Tipos de cálculo suportados pelo motor de simulação
 */
export enum ServiceCalculationType {
  FIXED = 'FIXED',                // Valor fixo (ex: R$ 500,00)
  PERCENTAGE_CIF = 'PERCENTAGE_CIF', // Percentual sobre CIF BRL (ex: 0,35%)
  PER_CONTAINER = 'PER_CONTAINER',   // Valor por container (ex: R$ 350 × qtd)
  PER_TONNE = 'PER_TONNE',           // Valor por tonelada ou m³ (Maior entre os dois no Aéreo)
  PER_KG = 'PER_KG',                 // Valor por quilograma (Aéreo)
}

/**
 * Interface principal do Serviço
 */
export interface Service {
  id: string;
  code: string; 
  name: string; 
  description?: string;
  category?: string; 
  modal: ServiceModal; // ⚠️ Adicionado para suportar Aéreo/Marítimo
  calculationType: ServiceCalculationType; 
  formulaExpression?: string; 
  isActive: boolean;
  hasStripping: boolean;
  hasLcl?: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Histórico de custos/taxas do serviço
 */
export interface ServiceCost {
  id: string;
  serviceId: string;
  cost: number; // TAXA base: 0.35 para %, 350 para valor fixo
  validFrom: string; 
  validUntil?: string | null; 
  createdBy: string;
  reason?: string;
  createdAt: string;
  service?: Partial<Service>;
  user?: {
    name: string;
    email: string;
  };
}

export interface ServiceWithCurrentCost extends Service {
  currentCost?: ServiceCost;
}

// ============================================
// DTOs (Data Transfer Objects)
// ============================================

export interface CreateServiceDto {
  code: string;
  name: string;
  description?: string;
  category?: string;
  modal: ServiceModal; // ⚠️ Obrigatório no cadastro
  calculationType: ServiceCalculationType;
  isActive: boolean;
  hasStripping: boolean;
  hasLcl?: boolean;
}

/**
 * Permite atualizações parciais (ex: apenas desativar um serviço)
 */
export interface UpdateServiceDto extends Partial<CreateServiceDto> {}

export interface CreateServiceCostDto {
  serviceId: string;
  cost: number;
  reason?: string;
}
