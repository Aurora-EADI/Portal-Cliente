import { api } from "@/lib/api";
import { ModuleAccess } from "@/types/access-control";

export const userModuleAccessService = {
    async getUserModulesWithAccessStatus(userId: string): Promise<{ modules: ModuleAccess[] }> {
        const response = await api.get(`/user-module-access/user/${userId}/modules`);
        return response.data;
    },
};
