import { api } from "@/lib/api";
import { UpdateUserDto, User } from "@/types/user";

export const usersService = {
    async update(id: string, data: UpdateUserDto): Promise<User> {
        const response = await api.patch(`/users/${id}`, data);
        return response.data;
    },
};
