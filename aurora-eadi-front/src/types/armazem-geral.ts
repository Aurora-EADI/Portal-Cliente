import type { Company } from '@/types/company';

export type OperationalContainerStatus = 'IN_WAREHOUSE' | 'OUT' | 'TRANSSHIPMENT';

export type OperationalContainerMovementType =
  | 'ENTRY'
  | 'EXIT'
  | 'LOCATION_UPDATE'
  | 'STATUS_CHANGE';

export interface OperationalContainer {
  id: string;
  warehouseId: string;
  containerNumber: string;
  containerType: string | null;
  entryNumber: string | null;
  exitNumber: string | null;
  originalSeal: string | null;
  entryDate: string | null;
  exitDate: string | null;
  freeTimeDate: string | null;
  isFull: boolean;
  origin: string | null;
  destination: string | null;
  observations: string | null;
  status: OperationalContainerStatus;
  location: string | null;
  customerId: string | null;
  customer?: { id: string; name: string; document: string; } | null;
  damages?: WarehouseDamage[];
  createdAt: string;
  updatedAt: string;
}

export interface CarrierRef {
  id: string;
  name: string;
  cnpj: string | null;
}

export interface DriverRef {
  id: string;
  name: string;
  cpf: string | null;
  phone: string | null;
}

export interface VehicleRef {
  id: string;
  plate: string;
  type: string | null;
}

export interface UserRef {
  id: string;
  name: string;
  email: string;
}

export interface OperationalContainerMovement {
  id: string;
  containerId: string;
  type: OperationalContainerMovementType;
  fromStatus: OperationalContainerStatus | null;
  toStatus: OperationalContainerStatus | null;
  location: string | null;
  carrierId: string | null;
  driverId: string | null;
  vehicleId: string | null;
  performedByUserId: string | null;
  createdAt: string;
  carrier?: CarrierRef | null;
  driver?: DriverRef | null;
  vehicle?: VehicleRef | null;
  performedByUser?: UserRef | null;
}

export interface OperationalContainerDetails extends OperationalContainer {
  customer?: { id: string; name: string; document: string; } | null;
  movements?: OperationalContainerMovement[];
}

export interface OriginContainerListResponse {
  data: OperationalContainer[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface OriginContainerQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: OperationalContainerStatus;
  customerId?: string;
  customerIds?: string[];
}

export interface OriginContainerEntryDto {
  containerNumber: string;
  containerType?: string;
  originalSeal?: string;
  location?: string;
  customerId?: string;
  carrierId?: string;
  driverId?: string;
  vehicleId?: string;
  entryDate?: string;
  freeTimeDate?: string;
  isFull?: boolean;
  origin?: string;
  destination?: string;
  observations?: string;
  avarias?: string[];
}

export interface WarehouseDamage {
  id: string;
  warehouseId: string;
  containerId?: string;
  ownedContainerId?: string;
  cargoId?: string;
  severity: string;
  status: string;
  description: string;
  photoObjectKeys: string[];
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OriginContainerExitDto {
  notes?: string;
  carrierId?: string;
  driverId?: string;
  vehicleId?: string;
  avarias?: string[];
}

export interface OriginContainerUpdateLocationDto {
  location: string;
}

export interface UpdateOperationalContainerDto {
  containerType?: string;
  originalSeal?: string;
  customerId?: string;
  entryDate?: string;
  freeTimeDate?: string;
  isFull?: boolean;
  origin?: string;
  destination?: string;
  location?: string;
  observations?: string;
  avarias?: string[];
}


export interface WarehouseCargo {
  id: string;
  warehouseId: string;
  containerId: string | null;
  ownedContainerId?: string | null;
  description: string;
  cargoType: string | null;
  weightKg: string | null;
  quantity: number;
  dangerous: boolean;
  
  // New Fields
  customerId?: string | null;
  documentType?: string | null;
  documentNumber?: string | null;
  entryDate?: string | null;
  exitDate?: string | null;
  entryContainerId?: string | null;
  exitContainerId?: string | null;
  packagingType?: string | null;
  volume?: number | null;
  location?: string | null;

  createdAt: string;
  updatedAt: string;
  
  ownedContainer?: {
    id: string;
    code: string;
    containerNumber: string | null;
    status: string;
  } | null;

  container?: {
    id: string;
    containerNumber: string;
    status: string;
    originalSeal?: string | null;
  } | null;
  customer?: {
    id: string;
    name: string;
    corporateName: string | null;
  } | null;
  entryContainer?: {
    id: string;
    containerNumber: string;
    originalSeal?: string | null;
  } | null;
  exitContainer?: {
    id: string;
    containerNumber: string;
  } | null;
  damages?: WarehouseDamage[];
}

export interface CargoListResponse {
  data: WarehouseCargo[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface CargoQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  containerIds?: string;
  ownedContainerIds?: string;
  activeOnly?: boolean;
}

export interface CreateWarehouseCargoDto {
  description: string;
  cargoType?: string;
  weightKg?: string;
  quantity?: number;
  dangerous?: boolean;
  containerId?: string;
  ownedContainerId?: string;
  customerId?: string;
  documentType?: string;
  documentNumber?: string;
  entryDate?: string;
  exitDate?: string;
  entryContainerId?: string;
  exitContainerId?: string;
  packagingType?: string;
  volume?: number;
  location?: string;
}

export interface UpdateWarehouseCargoDto extends Partial<CreateWarehouseCargoDto> {}

export interface WarehouseDashboardOverview {
  containers: Record<string, number>;
  warehouseContainers: Record<string, number>;
  openDamages: number;
  pendingTransshipments: number;
  cargosTotal: number;
}

export interface WarehouseDashboardKpis {
  period: { year: number; month: number };
  totalEntriesMonth: number;
  totalExitsMonth: number;
  totalTransshipmentsMonth: number;
  totalContainersInPatio: number;
  totalContainersWithDamageInPatio: number;
}

export interface WarehouseDashboardTopCustomerItem {
  customerId: string | null;
  customerName: string;
  total: number;
}

export interface WarehouseDashboardPatioDistribution {
  totals: {
    total: number;
    origin: number;
    owned: number;
  };
  occupancy: {
    full: number;
    fullOrigin: number;
    fullOwned: number;
    empty: number;
    emptyOrigin: number;
    emptyOwned: number;
  };
  damage: {
    withDamage: number;
    withoutDamage: number;
  };
}

export interface WarehouseDashboardTransshipmentsMonthly {
  months: { month: string; total: number }[];
}

export interface WarehouseDashboardDemurrageItem {
  id: string;
  containerNumber: string;
  containerType: string | null;
  location: string | null;
  entryDate: string | Date | null;
  freeTimeDate: string | Date;
  customer: { id: string; name: string; document: string } | null;
  daysRemaining: number;
  isOverdue: boolean;
}

export interface WarehouseDashboardDemurrageResponse {
  days: number;
  data: WarehouseDashboardDemurrageItem[];
}

export type WarehouseOwnedContainerStatus =
  | 'AVAILABLE'
  | 'IN_USE'
  | 'MAINTENANCE'
  | 'DAMAGED'
  | 'WITH_CUSTOMER';

export interface WarehouseOwnedContainer {
  id: string;
  warehouseId: string;
  code: string;
  containerNumber: string | null;
  containerType: string | null;
  status: WarehouseOwnedContainerStatus;
  isFull: boolean;
  supplierId: string | null;
  supplier?: WarehouseOwnedContainerSupplier | null;
  holderCustomerId?: string | null;
  holderCustomer?: { id: string; name: string; document?: string | null } | null;
  location: string | null;
  observations: string | null;
  damages?: WarehouseDamage[];
  maintenanceNotes: string | null;
  lastMaintenanceAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OwnedContainerListResponse {
  data: WarehouseOwnedContainer[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface OwnedContainerQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: WarehouseOwnedContainerStatus;
  inPatio?: boolean;
  customerIds?: string[];
}

export interface CreateOwnedContainerDto {
  code: string;
  containerNumber?: string;
  containerType?: string;
  status?: WarehouseOwnedContainerStatus;
  isFull?: boolean;
  supplierId?: string;
  location?: string;
  avarias?: string[];
  observations?: string;
  maintenanceNotes?: string;
}

export interface WarehouseOwnedContainerSupplier {
  id: string;
  warehouseId: string;
  name: string;
  document?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateContainerAgSupplierDto {
  name: string;
  document?: string;
}

export interface UpdateOwnedContainerDto extends Partial<CreateOwnedContainerDto> {}

export type TransshipmentStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';

export type TransshipmentReason =
  | 'CONTAINER_DAMAGE'
  | 'CARGO_REGROUPING'
  | 'CLIENT_REQUEST'
  | 'OTHER';

export interface ConferenteResponsavel {
  id: string;
  name: string;
  matricula: string;
  cpf: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateConferenteDto {
  name: string;
  matricula: string;
  cpf: string;
}

export interface UpdateConferenteDto extends Partial<CreateConferenteDto> {}

export interface ConferenteListResponse {
  data: ConferenteResponsavel[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ConferenteQueryParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface WarehouseTransshipment {
  id: string;
  warehouseId: string;
  containerId: string;
  cargoId: string | null;
  originalSeal: string | null;
  newSeal: string | null;
  reason: TransshipmentReason | null;
  destinationContainerId: string | null;
  destinationContainerNumber: string | null;
  responsibleName: string | null;
  responsibleMatricula: string | null;
  responsibleCpf: string | null;
  observations: string | null;
  status: TransshipmentStatus;
  createdAt: string;
  updatedAt: string;
  container?: {
    id: string;
    containerNumber: string;
    originalSeal: string | null;
    status: string;
  } | null;
  cargo?: {
    id: string;
    description: string;
  } | null;
}

export interface TransshipmentListResponse {
  data: WarehouseTransshipment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface TransshipmentQueryParams {
  page?: number;
  limit?: number;
  status?: TransshipmentStatus;
}

export interface CreateTransshipmentDto {
  containerId: string;
  cargoId?: string;
  originalSeal?: string;
  newSeal?: string;
  reason?: TransshipmentReason;
  destinationContainerId?: string;
  destinationContainerNumber?: string;
  responsibleName?: string;
  responsibleMatricula?: string;
  responsibleCpf?: string;
  observations?: string;
}

export interface UpdateTransshipmentDto {
  reason?: TransshipmentReason;
  destinationContainerId?: string;
  destinationContainerNumber?: string;
  newSeal?: string;
  responsibleName?: string;
  responsibleMatricula?: string;
  responsibleCpf?: string;
  observations?: string;
}


export interface CompleteTransshipmentDto {
  newSeal?: string;
  responsibleName?: string;
  observations?: string;
}

// ─── TRANSPORTADORAS ────────────────────────────────────────────────────────

export interface Transportadora {
  id: string;
  name: string;
  cnpj: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    drivers: number;
    vehicles: number;
  };
}

export interface TransportadoraDriver {
  id: string;
  carrierId: string;
  name: string;
  cpf: string | null;
  phone: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TransportadoraVehicle {
  id: string;
  carrierId: string;
  plate: string;
  type: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TransportadoraListResponse {
  data: Transportadora[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface TransportadoraDriverListResponse {
  data: TransportadoraDriver[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface TransportadoraVehicleListResponse {
  data: TransportadoraVehicle[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface TransportadoraQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  active?: boolean;
}

export interface CreateTransportadoraDto {
  name: string;
  cnpj?: string;
}

export interface UpdateTransportadoraDto extends Partial<CreateTransportadoraDto> {}

export interface CreateTransportadoraDriverDto {
  name: string;
  cpf?: string;
  phone?: string;
}

export interface UpdateTransportadoraDriverDto extends Partial<CreateTransportadoraDriverDto> {}

export interface CreateTransportadoraVehicleDto {
  plate: string;
  type?: string;
}

export interface UpdateTransportadoraVehicleDto extends Partial<CreateTransportadoraVehicleDto> {}

// ─── AUDITORIA ──────────────────────────────────────────────────────────────

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'STATUS_CHANGE';

export interface WarehouseAuditLog {
  id: string;
  warehouseId: string;
  entityType: string;
  entityId: string;
  action: AuditAction;
  before: any | null;
  after: any | null;
  performedByUserId: string | null;
  createdAt: string;
  performedByUser?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export interface AuditLogListResponse {
  data: WarehouseAuditLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface AuditLogQueryParams {
  page?: number;
  limit?: number;
  entityType?: string;
  entityId?: string;
  action?: AuditAction;
  performedByUserId?: string;
  from?: string;
  to?: string;
}
