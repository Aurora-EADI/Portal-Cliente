import { apiNest } from '@/lib/apiNest';
import type { ClienteResumo, Procuracao } from '@/types/procuracao';

const BASE_PATH = '/procuracoes';

export const procuracoesService = {
  listar: async (): Promise<Procuracao[]> => {
    const response = await apiNest.get(BASE_PATH);
    return response.data;
  },

  /** Clientes que ainda não têm procuração com este despachante. */
  clientesDisponiveis: async (): Promise<ClienteResumo[]> => {
    const response = await apiNest.get(`${BASE_PATH}/clientes-disponiveis`);
    return response.data;
  },

  enviar: async (clienteId: string, arquivo: File): Promise<Procuracao> => {
    const form = new FormData();
    form.append('clienteId', clienteId);
    form.append('arquivo', arquivo);

    const response = await apiNest.post(BASE_PATH, form, {
      // Deixa o browser montar o boundary do multipart. Herdar o
      // application/json do client faria o upload chegar quebrado no servidor.
      headers: { 'Content-Type': undefined },
    });
    return response.data;
  },

  /** URL do PDF — o backend faz streaming autenticado, não há link público. */
  urlArquivo: (id: string): string =>
    `${apiNest.defaults.baseURL}${BASE_PATH}/${id}/arquivo`,
};
