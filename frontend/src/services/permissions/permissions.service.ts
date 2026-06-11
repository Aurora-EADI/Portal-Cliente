import { api } from "@/lib/api";
import { Permission, PermissionDetail, CreatePermissionDto, UpdatePermissionDto } from "@/types/permission";

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
