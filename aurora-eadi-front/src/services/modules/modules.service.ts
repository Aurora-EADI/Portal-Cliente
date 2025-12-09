import httpClient from '../httpClient';

export interface Module {
  id: number;
  name: string;
  description: string;
  route?: string; // 🆕 Rota do frontend (ex: /logistics)
  icon?: string; // 🆕 Nome do ícone Lucide React (ex: Truck)
  createdAt: string;
  updatedAt: string;
  active: boolean;
  isEnabled: boolean;
  activities?: Activity[];
}

interface GetUserModulesResponse {
  user: any; 
  modules: Module[];
  summary: {
    totalModules: number;
    enabledModules: number;
    totalActivities: number;
    activeActivities: number;
  };
}

export interface Activity {
  id: number;
  name: string;
  description: string;
  moduleId: number;
  isActive: boolean;
  permissions?: string[];
  activityPermissions?: ActivityPermission[];
}

export interface ActivityPermission {
  id: number;
  activityId: number;
  permissionId: number;
  permission: Permission;
}

export interface Permission {
  id: number;
  name: string;
  description: string;
}

export interface CreateModuleDto {
  name: string;
  description: string;
  route?: string;
  icon?: string;
}

export const modulesService = {
  /**
   * Busca todos os módulos com suas atividades e permissões
   */
  getAll: async (userId: string): Promise<GetUserModulesResponse> => {
  try {
    const response = await httpClient.get(`/user-module-access/${userId}`);
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Erro ao buscar módulos';
    throw new Error(message);
  }
},

  /**
   * Cria um novo módulo
   */
  create: async (data: CreateModuleDto): Promise<Module> => {
    try {
      const response = await httpClient.post('/modules', data);
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Erro ao criar módulo';
      throw new Error(message);
    }
  },

  /**
   * Remove um módulo
   */
  remove: async (id: number): Promise<void> => {
    try {
      await httpClient.delete(`/modules/${id}`);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Erro ao remover módulo';
      throw new Error(message);
    }
  },
};