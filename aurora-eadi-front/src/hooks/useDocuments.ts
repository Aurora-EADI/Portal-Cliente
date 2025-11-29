import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentService } from '../services/api';
import { DocumentStatus, User } from '../types';

// Query Keys Constants
export const DOCS_KEY = ['documents'];

export const useDocuments = (user: User | null) => {
  return useQuery({
    queryKey: DOCS_KEY,
    queryFn: async () => {
      if (!user) return [];
      if (user.role === 'ADMIN') {
        return await documentService.getAll();
      } else if (user.companyId) {
        return await documentService.getByCompany(user.companyId);
      }
      return [];
    },
    enabled: !!user, // Só roda se tiver usuário
  });
};

export const useUploadDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ file, name, user }: { file: File; name: string; user: User }) => {
      return await documentService.upload(file, name, user);
    },
    onSuccess: () => {
      // Invalida o cache para forçar recarregamento da lista
      queryClient.invalidateQueries({ queryKey: DOCS_KEY });
    },
  });
};

export const useUpdateDocumentStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status, reason }: { id: string; status: DocumentStatus; reason?: string }) => {
      return await documentService.updateStatus(id, status, reason);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DOCS_KEY });
    },
  });
};