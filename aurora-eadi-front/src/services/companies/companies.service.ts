import { api } from "@/lib/api";
import { Company, CreateCompanyDTO } from "@/types/company";

export const companiesService = {
  async findAll(): Promise<Company[]> {
    const response = await api.get("/companies");
    return response.data;
  },

  async findByCnpj(cnpj: string): Promise<Company | null> {
    try {
      // Remove caracteres não numéricos antes de enviar
      const cleanCnpj = cnpj.replace(/\D/g, '');
      const response = await api.get(`/companies/cnpj/${cleanCnpj}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      const message = error.response?.data?.message || 'Erro ao buscar empresa por CNPJ';
      return Promise.reject(new Error(message));
    }
  },
};

export const registerCompanies = {
  create: async (data: CreateCompanyDTO) => {
    const response = await api.post("/companies", data);
    return response.data
  }
}
