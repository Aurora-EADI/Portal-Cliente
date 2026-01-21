export interface ActivityPermissions {
  id: number;
  name: string;
  isMandatory: boolean;
  isActive: boolean;
  permissions: string[];
}

export interface ModuleData {
  id: number;
  name: string;
  description: string | null;
  isEnabled: boolean;
  activities: ActivityPermissions[];
}

export interface UserPermissionsResponse {
  modules: ModuleData[];
  permissions: string[];
}
