import { api } from "@/lib/api";
import { Activity, ActivityDetail, CreateActivityDto, UpdateActivityDto, UpdateActivityPermissionsDto, ActivityPermission } from "@/types/activity";

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
