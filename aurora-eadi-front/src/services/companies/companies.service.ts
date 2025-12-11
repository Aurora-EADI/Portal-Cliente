import { api } from "@/lib/api";
import { Company, CreateCompanyDTO } from "@/types/company";

export const companiesService = {
  async findAll(): Promise<Company[]> {
    const response = await api.get("/companies");
    return response.data;
  },
};

export const registerCompanies = {
  create: async (data: CreateCompanyDTO) => {
    const response = await api.post("/companies", data);
    return response.data
  }
}
