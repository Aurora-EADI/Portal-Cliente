'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { averbacoesService } from '@/services/averbacoes.service';
import type { CriarAverbacaoDto } from '@/types/averbacao';

export const AVERBACAO_KEYS = {
  all: ['averbacoes'] as const,
  list: () => [...AVERBACAO_KEYS.all, 'list'] as const,
  detail: (id: string) => [...AVERBACAO_KEYS.all, 'detail', id] as const,
  clientesAutorizados: () =>
    [...AVERBACAO_KEYS.all, 'clientes-autorizados'] as const,
  tipos: (modalidade: string) =>
    [...AVERBACAO_KEYS.all, 'tipos', modalidade] as const,
};

export function useAverbacoes() {
  return useQuery({
    queryKey: AVERBACAO_KEYS.list(),
    queryFn: () => averbacoesService.listar(),
  });
}

export function useAverbacao(id: string) {
  return useQuery({
    queryKey: AVERBACAO_KEYS.detail(id),
    queryFn: () => averbacoesService.detalhar(id),
    enabled: Boolean(id),
  });
}

export function useClientesAutorizados() {
  return useQuery({
    queryKey: AVERBACAO_KEYS.clientesAutorizados(),
    queryFn: () => averbacoesService.clientesAutorizados(),
  });
}

/** Prévia dos documentos exigidos, antes de o processo existir. */
export function useTiposPorModalidade(modalidade: string | undefined) {
  return useQuery({
    queryKey: AVERBACAO_KEYS.tipos(modalidade ?? ''),
    queryFn: () => averbacoesService.tiposPorModalidade(modalidade!),
    enabled: Boolean(modalidade),
  });
}

export function useCriarAverbacao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CriarAverbacaoDto) => averbacoesService.criar(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AVERBACAO_KEYS.list() });
    },
  });
}

export function useEnviarDocumento(processoId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      tipoDocumentoId,
      arquivo,
    }: {
      tipoDocumentoId: string;
      arquivo: File;
    }) =>
      averbacoesService.enviarDocumento(processoId, tipoDocumentoId, arquivo),
    onSuccess: () => {
      // O envio muda o status do processo, então invalida detalhe e lista.
      queryClient.invalidateQueries({
        queryKey: AVERBACAO_KEYS.detail(processoId),
      });
      queryClient.invalidateQueries({ queryKey: AVERBACAO_KEYS.list() });
    },
  });
}
