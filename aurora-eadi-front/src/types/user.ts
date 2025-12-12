import { UserRole } from "./auth";
import { Company } from "./company";
import { UserModuleAccess } from "./access-control";

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    companyId: string | null;
    position: string | null;
    createdAt: string;
    updatedAt: string;
    company?: Company;
    moduleAccess?: UserModuleAccess[];
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
