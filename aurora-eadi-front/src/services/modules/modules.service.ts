import { api } from "@/lib/api";
import { Module, CreateModuleDto } from "@/types/module";

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