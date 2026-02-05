export interface ModuleActivity {
    id: number;
    name: string;
    isMandatory: boolean;
    permissions: Array<{
        permission: {
            id: number;
            key: string;
            description: string;
            category: string;
        };
    }>;
}

export interface Module {
    id: number;
    name: string;
    description: string;
    active?: boolean;
    activities?: ModuleActivity[];
    icon?: string;
    route?: string;
    createdAt?: string;
    updatedAt?: string;
    isEnabled?: boolean;
}

export interface CreateModuleDto {
    name: string;
    description?: string;
    route: string;
    icon: string;
}

export interface UpdateModuleDto {
    name?: string;
    description?: string;
    route?: string;
    icon?: string;
    active?: boolean;
}
