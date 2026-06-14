import { UserRole } from "./auth";

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    companyId: string | null;
    clienteId?: string | null;
    position: string | null;
    active?: boolean;
    createdAt: string;
    updatedAt: string;
    cliente?: { id: string; nome: string; cnpj?: string } | null;
}

export interface CreateUserDto {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    companyId?: string;
    position?: string;
}

export interface UpdateUserDto {
    name?: string;
    email?: string;
    password?: string;
    role?: UserRole;
    companyId?: string;
    position?: string;
}

export interface CreateUserDTO extends Omit<CreateUserDto, 'position' | 'role'> {
    position?: string;
}
