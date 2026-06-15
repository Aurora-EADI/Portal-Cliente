export interface ModuleSharedItem {
    targetRoute: string;
    label: string;
    icon?: string;
    sortOrder?: number;
}

export interface ActivityAccess {
    id: number;
    name: string;
    isActive: boolean;
    permissions?: Array<string | { key: string }>;
}

export interface ModuleAccess {
    id: number;
    name: string;
    description?: string;
    route?: string;
    icon?: string;
    isEnabled: boolean;
    userModuleAccessId: number;
    activities: ActivityAccess[];
    totalActivities: number;
    activeActivities: number;
    sharedItems: ModuleSharedItem[] | null;
}
