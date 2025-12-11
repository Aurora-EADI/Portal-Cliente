// User Module Access Related

export interface UserModuleAccess {
    id: number;
    userId: string;
    moduleId: number;
    isEnabled: boolean;
    module: {
        id: number;
        name: string;
        description: string;
        active: boolean;
    };
    activityAccess?: Array<{
        id: number;
        activityId: number;
        isEnabled: boolean;
        activity: {
            id: number;
            name: string;
            moduleId: number;
            isMandatory: boolean;
        };
    }>;
}

export interface ActivityAccess {
    id: number;
    name: string;
    isMandatory: boolean;
    isActive: boolean;
    permissions: string[];
}

export interface ModuleAccess {
    id: number;
    name: string;
    description: string;
    isEnabled: boolean;
    userModuleAccessId: number | null;
    activities: ActivityAccess[];
    totalActivities: number;
    activeActivities: number;
    route?: string;
    icon?: string;
}

export interface UserModulesAccessStatus {
    user: {
        id: string;
        name: string;
        email: string;
        role: string;
    };
    modules: ModuleAccess[];
    summary: {
        totalModules: number;
        enabledModules: number;
        totalActivities: number;
        activeActivities: number;
    };
}

export interface ToggleModuleDto {
    isEnabled: boolean;
}

export interface BulkAssignModulesDto {
    moduleIds: number[];
    isEnabled: boolean;
}

export interface ModuleUsageStats {
    id: number;
    name: string;
    description: string;
    totalActivities: number;
    totalUsers: number;
    users: Array<{
        id: string;
        name: string;
        email: string;
    }>;
}

// User Activity Access Related

export interface UserActivityPermission {
    id: number;
    key: string;
    description: string;
    category: string;
}

export interface ActivityAccessDetail {
    id: number;
    name: string;
    isMandatory: boolean;
    isEnabled: boolean;
    canToggle: boolean;
    permissions: UserActivityPermission[];
    userActivityAccessId: number | null;
}

export interface ActivitiesAccessResponse {
    user: {
        id: string;
        name: string;
        email: string;
    };
    module: {
        id: number;
        name: string;
        description: string;
    };
    hasModuleAccess: boolean;
    userModuleAccessId?: number;
    message?: string;
    activities: ActivityAccessDetail[];
    summary?: {
        totalActivities: number;
        mandatoryActivities: number;
        optionalActivities: number;
        enabledActivities: number;
    };
}

export interface ToggleActivityDto {
    isEnabled: boolean;
}

export interface BulkConfigureActivitiesDto {
    activities: Array<{
        activityId: number;
        isEnabled: boolean;
    }>;
}

export interface ActivityUsageStats {
    id: number;
    name: string;
    moduleId: number;
    moduleName: string;
    isMandatory: boolean;
    totalUsers: number;
    permissions: string[];
    users: Array<{
        id: string;
        name: string;
        email: string;
    }>;
}

export interface UserActivityResponse {
    id: number;
    name: string;
    moduleId: number;
    moduleName: string;
    isMandatory: boolean;
    isEnabled: boolean;
}

export interface UserPermissionResponse {
    id: number;
    key: string;
    description: string;
    category: string;
    source: "mandatory_activity" | "optional_activity";
    activityName: string;
    moduleName: string;
}

export interface UserPermissionsResult {
    userId: string;
    userName: string;
    totalPermissions: number;
    permissions: UserPermissionResponse[];
}
