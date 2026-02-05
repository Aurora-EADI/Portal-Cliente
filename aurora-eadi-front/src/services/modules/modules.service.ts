import { api } from "@/lib/api";
import { Module, CreateModuleDto, UpdateModuleDto } from "@/types/module";

export const modulesService = {
  async findAll(): Promise<Module[]> {
    const response = await api.get("/modules");
    return response.data;
  },

  async findOne(id: number): Promise<Module> {
    const response = await api.get(`/modules/${id}`);
    return response.data;
  },

  async create(data: CreateModuleDto): Promise<Module> {
    const response = await api.post("/modules", data);
    return response.data;
  },

  async update(id: number, data: UpdateModuleDto): Promise<Module> {
    const response = await api.patch(`/modules/${id}`, data);
    return response.data;
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/modules/${id}`);
  },
};