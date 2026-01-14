export enum CustomerStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export interface Customer {
  id: string;
  code: string;
  name: string;
  document: string;
  status: CustomerStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerDTO {
  code: string;
  name: string;
  document: string;
}

export interface UpdateCustomerDTO {
  code?: string;
  name?: string;
  document?: string;
  status?: CustomerStatus;
}
