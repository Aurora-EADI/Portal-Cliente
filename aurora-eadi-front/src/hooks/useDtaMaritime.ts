import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { dtaMaritimeService } from '@/services/dtaMaritimeService';
import {
  CreateContainerDtaDto,
  CreateProcessoDto,
  UpdateContainerDtaDto,
  UpdateProcessoDto,
} from '@/types/dtaMaritime';
import { toast } from 'sonner';

export const DTA_MARITIME_KEY = ['dta-maritime-processos'];
export const DTA_MARITIME_DETAIL_KEY = ['dta-maritime-processo-detail'];

// ========== QUERIES ==========

export const useProcessos = (search?: string) => {
  return useQuery({
    queryKey: [...DTA_MARITIME_KEY, { search }],
    queryFn: () => dtaMaritimeService.getAll(search),
  });
};

export const useProcesso = (id: string | null) => {
  return useQuery({
    queryKey: [...DTA_MARITIME_DETAIL_KEY, id],
    queryFn: () => dtaMaritimeService.getById(id!),
    enabled: !!id,
  });
};

// ========== PROCESSO MUTATIONS ==========

export const useCreateProcesso = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProcessoDto) => dtaMaritimeService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DTA_MARITIME_KEY });
      toast.success('Processo criado com sucesso!');
    },
    onError: (error: Error) => toast.error(error.message),
  });
};

export const useUpdateProcesso = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProcessoDto }) =>
      dtaMaritimeService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: DTA_MARITIME_KEY });
      queryClient.invalidateQueries({
        queryKey: [...DTA_MARITIME_DETAIL_KEY, variables.id],
      });
      toast.success('Processo atualizado com sucesso!');
    },
    onError: (error: Error) => toast.error(error.message),
  });
};

export const useDeleteProcesso = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => dtaMaritimeService.delete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: DTA_MARITIME_KEY });
      queryClient.removeQueries({ queryKey: [...DTA_MARITIME_DETAIL_KEY, id] });
      toast.success('Processo excluído com sucesso!');
    },
    onError: (error: Error) => toast.error(error.message),
  });
};

// ========== CONTAINER MUTATIONS ==========

export const useAddContainer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ processoId, data }: { processoId: string; data: CreateContainerDtaDto }) =>
      dtaMaritimeService.addContainer(processoId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: DTA_MARITIME_KEY });
      queryClient.invalidateQueries({
        queryKey: [...DTA_MARITIME_DETAIL_KEY, variables.processoId],
      });
      toast.success('Container adicionado com sucesso!');
    },
    onError: (error: Error) => toast.error(error.message),
  });
};

export const useUpdateContainer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, processoId, data }: { id: string; processoId: string; data: UpdateContainerDtaDto }) =>
      dtaMaritimeService.updateContainer(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: DTA_MARITIME_KEY });
      queryClient.invalidateQueries({
        queryKey: [...DTA_MARITIME_DETAIL_KEY, variables.processoId],
      });
      toast.success('Container atualizado com sucesso!');
    },
    onError: (error: Error) => toast.error(error.message),
  });
};

export const useDeleteContainer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, processoId }: { id: string; processoId: string }) =>
      dtaMaritimeService.deleteContainer(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: DTA_MARITIME_KEY });
      queryClient.invalidateQueries({
        queryKey: [...DTA_MARITIME_DETAIL_KEY, variables.processoId],
      });
      toast.success('Container removido com sucesso!');
    },
    onError: (error: Error) => toast.error(error.message),
  });
};
