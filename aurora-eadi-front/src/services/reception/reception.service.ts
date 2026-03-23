import { api } from '@/lib/api';
import { ReceptionContact, CreateContactDto, UpdateContactDto } from '@/types/reception/contact';

export const receptionService = {
  async findAll(filters?: { name?: string; department?: string; position?: string; page?: number; limit?: number }): Promise<{ data: ReceptionContact[], total: number }> {
    const params = new URLSearchParams();
    if (filters?.name) params.append('name', filters.name);
    if (filters?.department) params.append('department', filters.department);
    if (filters?.position) params.append('position', filters.position);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await api.get(`/reception?${params.toString()}`);
    return response.data;
  },

  async findOne(id: string): Promise<ReceptionContact> {
    const response = await api.get(`/reception/${id}`);
    return response.data;
  },

  async create(dto: CreateContactDto): Promise<ReceptionContact> {
    const response = await api.post('/reception', dto);
    return response.data;
  },

  async update(id: string, dto: UpdateContactDto): Promise<ReceptionContact> {
    const response = await api.patch(`/reception/${id}`, dto);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/reception/${id}`);
  },
};
