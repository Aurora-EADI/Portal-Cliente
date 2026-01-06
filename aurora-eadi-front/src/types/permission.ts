export interface Permission {
    id: number;
    key: string;
    description: string;
    category: string;
    activitiesCount?: number;
    linkedActivities?: Array<{
        id: number;
        name: string;
        moduleId: number;
    }>;
    name?: string; // from existing modules.service definition
}

export interface PermissionDetail {
    id: number;
    key: string;
    description: string;
    category: string;
    activitiesCount?: number;
    linkedActivities: Array<{
        id: number;
        name: string;
        module: string;
        moduleId?: number;
    }>;
}

export interface CreatePermissionDto {
    key: string;
    description?: string;
    category?: string;
}

export interface UpdatePermissionDto {
    key?: string;
    description?: string;
    category?: string;
}
