export interface ActivityPermission {
    id: number;
    key: string;
    description: string;
    category: string;
}

export interface Activity {
    id: number;
    name: string;
    moduleId: number;
    moduleName: string;
    isMandatory: boolean;
    permissions: ActivityPermission[];
    userAccessCount?: number;
    description?: string;
    isActive?: boolean;
}

export interface ActivityDetail extends Activity {
    module: {
        id: number;
        name: string;
        description: string;
    };
    usersWithAccess?: Array<{
        id: string;
        name: string;
        email: string;
        isEnabled: boolean;
    }>;
}

export interface CreateActivityDto {
    name: string;
    moduleId: number;
    isMandatory?: boolean;
    permissionIds: number[];
}

export interface UpdateActivityDto {
    name?: string;
    moduleId?: number;
    isMandatory?: boolean;
}

export interface UpdateActivityPermissionsDto {
    permissionIds: number[];
}
