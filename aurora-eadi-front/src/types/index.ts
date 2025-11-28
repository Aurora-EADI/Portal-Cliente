
export enum UserRole {
  ADMIN = 'ADMIN',
  SUPPLIER = 'SUPPLIER'
}

export enum DocumentStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export enum CompanyStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  REJECTED = 'REJECTED'
}

export interface Company {
  id: string
  cnpj: string
  fantasyName: string
  socialReason: string
  zipCode: string
  address: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string
  phone: string
  status: CompanyStatus
  createdAt?: string
}

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  companyId?: string
  password?: string
}

export interface Document {
  id: string
  userId: string
  companyId: string
  name: string
  fileType: 'pdf' | 'jpg' | 'png'
  fileUrl: string
  uploadedAt: string
  status: DocumentStatus
  rejectionReason?: string
}

export interface CreateCompanyDTO extends Omit<Company, 'id' | 'createdAt' | 'status'> {}
export interface CreateUserDTO extends Omit<User, 'id' | 'companyId' | 'role'> {
  password?: string
}
