export interface BillOfLading {
  id: string;
  containerId: string;
  numero: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContainerDta {
  id: string;
  processoId: string;
  number: string;
  tipo: string;
  bls?: BillOfLading[];
  createdAt: string;
  updatedAt: string;
}

export interface ProcessoImportacao {
  id: string;
  dta: string;
  empresa: string;
  porto: string;
  navio: string;
  ataDta?: string | null;
  ataMao?: string | null;
  ataEadi?: string | null;
  conclusao?: string | null;
  transportador?: string | null;
  comissaria?: string | null;
  fobTotal?: number | null;
  freteTotal?: number | null;
  cifTotal?: number | null;
  containers?: ContainerDta[];
  _count?: { containers: number };
  createdAt: string;
  updatedAt: string;
}

export interface CreateContainerDtaDto {
  number: string;
  tipo: string;
  /** Lista de números de BL — mínimo 1 */
  bls: string[];
}

export interface UpdateContainerDtaDto {
  number?: string;
  tipo?: string;
  /** Quando presente, substitui todos os BLs do container (replace-all) */
  bls?: string[];
}

export interface CreateProcessoDto {
  dta: string;
  empresa: string;
  porto: string;
  navio: string;
  ataDta?: string;
  ataMao?: string;
  ataEadi?: string;
  conclusao?: string;
  transportador?: string;
  comissaria?: string;
  fobTotal?: number;
  freteTotal?: number;
  cifTotal?: number;
  containers: CreateContainerDtaDto[];
}

export interface UpdateProcessoDto {
  dta?: string;
  empresa?: string;
  porto?: string;
  navio?: string;
  ataDta?: string;
  ataMao?: string;
  ataEadi?: string;
  conclusao?: string;
  transportador?: string;
  comissaria?: string;
  fobTotal?: number;
  freteTotal?: number;
  cifTotal?: number;
}
