export interface Company {
    id: string;
    cnpj: string;
    fantasyName: string;
    socialReason?: string;
    zipCode?: string;
    address?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    phone?: string;
    status?: CompanyStatus;
    hasUser?: boolean; // Indica se a empresa já tem usuário cadastrado
    createdAt?: string;
    updatedAt?: string;
}

export enum CompanyStatus {
    PENDING = 'PENDING',
    ACTIVE = 'ACTIVE',
    REJECTED = 'REJECTED'
}

export interface CreateCompanyDTO extends Omit<Company, 'id' | 'createdAt' | 'status'> { }
