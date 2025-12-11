import { api } from "@/lib/api";
import { CreateUserDto, UpdateUserDto, User } from "@/types/user";
import { UserModuleAccess, UserActivityResponse, UserPermissionsResult } from "@/types/access-control";

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
