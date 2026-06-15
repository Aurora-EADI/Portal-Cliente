import { api } from "@/lib/api";
import { UserModulesAccessStatus, ToggleModuleDto, BulkAssignModulesDto, ModuleUsageStats } from "@/types/access-control";

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
