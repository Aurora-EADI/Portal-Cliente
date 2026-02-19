export interface ModuleActivity {
    id: number;
    name: string;
    isMandatory: boolean;
    route?: string;
    label?: string;
    icon?: string;
    sortOrder?: number;
    permissions: Array<{
        permission: {
            id: number;
            key: string;
            description: string;
            category: string;
        };
    }>;
}

export interface ModuleSubPage {
    id?: number;
    targetRoute: string;
    label: string;
    icon?: string;
    sortOrder?: number;
}

export interface Module {
    id: number;
    name: string;
    description: string;
    active?: boolean;
    activities?: ModuleActivity[];
    sharedItems?: ModuleSubPage[];
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
    subPages?: ModuleSubPage[];
}

export interface UpdateModuleDto {
    name?: string;
    description?: string;
    route?: string;
    icon?: string;
    active?: boolean;
    subPages?: ModuleSubPage[];
}
