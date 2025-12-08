import { api } from "@/lib/api";

// ==================== USERS TYPES ====================

export enum UserRole {
  ADMIN = "ADMIN",
  SUPPLIER = "SUPPLIER",
  EMPLOYEE = "EMPLOYEE",
}

export interface Company {
  id: number;
  fantasyName: string;
  cnpj: string;
  status?: string;
}

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

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  companyId: number | null;
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
  companyId?: number;
  position?: string;
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
  password?: string;
  role?: UserRole;
  companyId?: number;
  position?: string;
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

// ==================== MODULES TYPES ====================

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
}

export interface CreateModuleDto {
  name: string;
  description?: string;
}

// ==================== ACTIVITIES TYPES ====================

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

// ==================== PERMISSIONS TYPES ====================

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

// ==================== USER MODULE ACCESS TYPES ====================

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

// ==================== USER ACTIVITY ACCESS TYPES ====================

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

// ==================== USERS SERVICE ====================

export const usersService = {
  async create(data: CreateUserDto): Promise<User> {
    const response = await api.post("/users", data);
    return response.data;
  },

  async findAll(): Promise<User[]> {
    const response = await api.get("/users");
    return response.data;
  },

  async findOne(id: string): Promise<User> {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  async update(id: string, data: UpdateUserDto): Promise<User> {
    const response = await api.patch(`/users/${id}`, data);
    return response.data;
  },

  async remove(id: string): Promise<{ message: string }> {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  async getUserModules(id: string): Promise<UserModuleAccess[]> {
    const response = await api.get(`/users/${id}/modules`);
    return response.data;
  },

  async getUserActivities(id: string): Promise<UserActivityResponse[]> {
    const response = await api.get(`/users/${id}/activities`);
    return response.data;
  },

  async getUserPermissions(id: string): Promise<UserPermissionsResult> {
    const response = await api.get(`/users/${id}/permissions`);
    return response.data;
  },
};

// ==================== MODULES SERVICE ====================

export const modulesService = {
  async findAll(): Promise<Module[]> {
    const response = await api.get("/modules");
    return response.data;
  },

  async create(data: CreateModuleDto): Promise<Module> {
    const response = await api.post("/modules", data);
    return response.data;
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/modules/${id}`);
  },
};

// ==================== ACTIVITIES SERVICE ====================

export const activitiesService = {
  async findAll(moduleId?: number): Promise<Activity[]> {
    const params = moduleId ? { moduleId } : {};
    const response = await api.get("/activities", { params });
    return response.data;
  },

  async findOne(id: number): Promise<ActivityDetail> {
    const response = await api.get(`/activities/${id}`);
    return response.data;
  },

  async create(data: CreateActivityDto): Promise<{
    message: string;
    activity: Activity;
  }> {
    const response = await api.post("/activities", data);
    return response.data;
  },

  async update(
    id: number,
    data: UpdateActivityDto
  ): Promise<{
    message: string;
    activity: Activity;
  }> {
    const response = await api.patch(`/activities/${id}`, data);
    return response.data;
  },

  async updatePermissions(
    id: number,
    data: UpdateActivityPermissionsDto
  ): Promise<{
    message: string;
    activity: {
      id: number;
      name: string;
      permissions: ActivityPermission[];
    };
  }> {
    const response = await api.put(`/activities/${id}/permissions`, data);
    return response.data;
  },

  async remove(id: number): Promise<{ message: string }> {
    const response = await api.delete(`/activities/${id}`);
    return response.data;
  },

  async findWithoutPermissions(): Promise<{
    count: number;
    activities: Array<{
      id: number;
      name: string;
      moduleId: number;
      moduleName: string;
      isMandatory: boolean;
    }>;
  }> {
    const response = await api.get("/activities/without-permissions");
    return response.data;
  },

  async findByPermissionCategory(category: string): Promise<
    Array<{
      id: number;
      name: string;
      moduleName: string;
      permissions: ActivityPermission[];
    }>
  > {
    const response = await api.get(`/activities/by-category/${category}`);
    return response.data;
  },
};

// ==================== PERMISSIONS SERVICE ====================

export const permissionsService = {
  async findAll(category?: string): Promise<Permission[]> {
    const params = category ? { category } : {};
    const response = await api.get("/permissions", { params });
    return response.data;
  },

  async findOne(id: number): Promise<PermissionDetail> {
    const response = await api.get(`/permissions/${id}`);
    return response.data;
  },

  async create(data: CreatePermissionDto): Promise<{
    message: string;
    permission: Permission;
  }> {
    const response = await api.post("/permissions", data);
    return response.data;
  },

  async update(
    id: number,
    data: UpdatePermissionDto
  ): Promise<{
    message: string;
    permission: Permission;
  }> {
    const response = await api.patch(`/permissions/${id}`, data);
    return response.data;
  },

  async remove(id: number): Promise<{ message: string }> {
    const response = await api.delete(`/permissions/${id}`);
    return response.data;
  },

  async getCategories(): Promise<string[]> {
    const response = await api.get("/permissions/categories");
    return response.data;
  },

  async findOrphaned(): Promise<{
    count: number;
    permissions: Permission[];
  }> {
    const response = await api.get("/permissions/orphaned");
    return response.data;
  },
};

// ==================== USER MODULE ACCESS SERVICE ====================

export const userModuleAccessService = {
  async getUserModulesWithAccessStatus(
    userId: string
  ): Promise<UserModulesAccessStatus> {
    const response = await api.get(`/user-module-access/${userId}`);
    return response.data;
  },

  async toggleModule(
    userId: string,
    moduleId: number,
    data: ToggleModuleDto
  ): Promise<{
    message: string;
    userModuleAccess: {
      id: number;
      userId: string;
      moduleId: number;
      moduleName: string;
      isEnabled: boolean;
    };
  }> {
    const response = await api.put(
      `/user-module-access/${userId}/toggle/${moduleId}`,
      data
    );
    return response.data;
  },

  async assignMultipleModules(
    userId: string,
    data: BulkAssignModulesDto
  ): Promise<{
    message: string;
    results: Array<{
      moduleId: number;
      moduleName: string;
      isEnabled: boolean;
    }>;
  }> {
    const response = await api.post(
      `/user-module-access/${userId}/bulk`,
      data
    );
    return response.data;
  },

  async removeModuleAccess(
    userId: string,
    moduleId: number
  ): Promise<{ message: string }> {
    const response = await api.delete(
      `/user-module-access/${userId}/remove/${moduleId}`
    );
    return response.data;
  },

  async getModuleUsageStats(): Promise<ModuleUsageStats[]> {
    const response = await api.get("/user-module-access/stats/modules");
    return response.data;
  },

  async syncMandatoryActivities(moduleId: number): Promise<{
    message: string;
    synced: number;
    module: string;
  }> {
    const response = await api.post(
      `/user-module-access/sync/${moduleId}`
    );
    return response.data;
  },
};

// ==================== USER ACTIVITY ACCESS SERVICE ====================

export const userActivityAccessService = {
  async getActivitiesAccess(
    userId: string,
    moduleId: number
  ): Promise<ActivitiesAccessResponse> {
    const response = await api.get(
      `/user-activity-access/${userId}/${moduleId}/activities`
    );
    return response.data;
  },

  async toggleActivity(
    userId: string,
    moduleId: number,
    activityId: number,
    data: ToggleActivityDto
  ): Promise<{
    message: string;
    userActivityAccess: {
      id: number;
      activityId: number;
      activityName: string;
      moduleName: string;
      isEnabled: boolean;
      isMandatory: boolean;
    };
  }> {
    const response = await api.put(
      `/user-activity-access/${userId}/module/${moduleId}/activity/${activityId}`,
      data
    );
    return response.data;
  },

  async configureBulkActivities(
    userId: string,
    moduleId: number,
    data: BulkConfigureActivitiesDto
  ): Promise<{
    message: string;
    results: Array<{
      activityId: number;
      activityName: string;
      isEnabled: boolean;
      isMandatory: boolean;
    }>;
  }> {
    const response = await api.post(
      `/user-activity-access/${userId}/module/${moduleId}/bulk`,
      data
    );
    return response.data;
  },

  async removeActivityException(
    userId: string,
    moduleId: number,
    activityId: number
  ): Promise<{
    message: string;
    activity: {
      id: number;
      name: string;
      moduleName: string;
      isMandatory: boolean;
      defaultState: boolean;
    };
  }> {
    const response = await api.delete(
      `/user-activity-access/${userId}/${moduleId}/activity/${activityId}/exception`
    );
    return response.data;
  },

  async resetModuleActivities(
    userId: string,
    moduleId: number
  ): Promise<{
    message: string;
    deletedCount: number;
  }> {
    const response = await api.delete(
      `/user-activity-access/${userId}/${moduleId}/reset`
    );
    return response.data;
  },

  async getActivityUsageStats(
    moduleId?: number
  ): Promise<ActivityUsageStats[]> {
    const params = moduleId ? { moduleId } : {};
    const response = await api.get("/user-activity-access/stats/activities", {
      params,
    });
    return response.data;
  },
};
