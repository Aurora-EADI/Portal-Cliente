export enum CompanyClassification {
    MEI = 'MEI',
    ME = 'ME',
    EPP = 'EPP',
    EIRELI = 'EIRELI',
}

export enum AllocationRegime {
    NO_WORKFORCE_AT_EADI = 'NO_WORKFORCE_AT_EADI',
    FULL_WORKFORCE_AT_EADI = 'FULL_WORKFORCE_AT_EADI',
}

export enum EmployeeStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
}

export interface Company {
    id: string;
    cnpj: string;
    fantasyName: string;
    socialReason: string;
    zipCode: string;
    address: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    phone: string;
    classification?: CompanyClassification;
    allocationRegime?: AllocationRegime;
    supplierTypeIds?: string[];
    workforceEmployees?: WorkforceEmployeeInput[];
    status?: CompanyStatus;
    hasUser?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface WorkforceEmployeeInput {
    fullName: string;
    cpf: string;
    position: string;
    hiredAt: string;
}

export enum CompanyStatus {
    PENDING = 'PENDING',
    PENDING_ACTIVE = "PENDING_ACTIVE",
    ACTIVE = 'ACTIVE',
    REJECTED = 'REJECTED'
}

export interface CreateCompanyDTO extends Omit<Company, 'id' | 'createdAt' | 'status' | 'updatedAt' | 'hasUser'> { }
