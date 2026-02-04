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
  description: string | null;
  category: string | null;
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
