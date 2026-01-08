import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentService } from '../services/api';
import { DocumentStatus, User } from '../types';
import { toast } from 'sonner';

// Query Keys Constants
export const DOCS_KEY = ['documents'];

export const useDocuments = (user: User | null) => {
  return useQuery({
    queryKey: [...DOCS_KEY, user?.id],
    queryFn: async () => {
      if (!user) return [];
      if (user.role === 'ADMIN') {
        return await documentService.getAll();
      } else if (user.companyId) {
        return await documentService.getByCompany(String(user.companyId));
      }
      return [];
    },
    enabled: !!user, // Só roda se tiver usuário
  });
};

export const useUploadDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ file, name, user, dateIssue, dateExpiration, documentTypeId }: {
      file: File;
      name: string;
      user: User;
      dateIssue?: string;
      dateExpiration?: string;
      documentTypeId?: string;
    }) => {
      return await documentService.upload(file, name, user, dateIssue, dateExpiration, documentTypeId);
    },
    onSuccess: () => {
      // Invalida o cache para forçar recarregamento da lista
      queryClient.invalidateQueries({ queryKey: DOCS_KEY });
      toast.success('Documento enviado com sucesso!');
    },
  });
};

export const useUpdateDocumentStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status, reason }: { id: string; status: DocumentStatus; reason?: string }) => {
      return await documentService.updateStatus(id, status, reason);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: DOCS_KEY });

      if (variables.status === DocumentStatus.APPROVED) {
        toast.success('Documento aprovado com sucesso!');
      } else if (variables.status === DocumentStatus.REJECTED) {
        toast.success('Documento rejeitado.');
      }
    },
  });
};