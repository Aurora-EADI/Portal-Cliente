import { api } from "@/lib/api";

export type UserMobileRole = "INSPECTOR" | "SUPERVISOR";

export interface MobileUser {
  id: string;
  name: string;
  email: string;
  role: UserMobileRole;
  avatarInitials: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMobileUserDto {
  name: string;
  email: string;
  password: string;
  role?: UserMobileRole;
}

export interface UpdateMobileUserDto {
  name?: string;
  email?: string;
  password?: string;
  role?: UserMobileRole;
}

export interface PaginatedMobileUsersResponse {
  data: MobileUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export const mobileUsersService = {
  async findAll(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<PaginatedMobileUsersResponse> {
    const response = await api.get("/mobile/users", { params });
    return response.data;
  },

  async findOne(id: string): Promise<MobileUser> {
    const response = await api.get(`/mobile/users/${id}`);
    return response.data;
  },

  async create(data: CreateMobileUserDto): Promise<MobileUser> {
    const response = await api.post("/mobile/users", data);
    return response.data;
  },

  async update(id: string, data: UpdateMobileUserDto): Promise<MobileUser> {
    const response = await api.patch(`/mobile/users/${id}`, data);
    return response.data;
  },

  async remove(id: string): Promise<{ message: string }> {
    const response = await api.delete(`/mobile/users/${id}`);
    return response.data;
  },
};
