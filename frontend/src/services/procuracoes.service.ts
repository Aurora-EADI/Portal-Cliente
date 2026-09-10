import { apiNest } from '@/lib/apiNest';
import type { ClienteRepresentado, Procuracao } from '@/types/procuracao';

const BASE_PATH = '/procuracoes';

export const procuracoesService = {
  /** Todos os representados, com ou sem procuração. É o que a tela lista. */
  representados: async (): Promise<ClienteRepresentado[]> => {
    const response = await apiNest.get(`${BASE_PATH}/representados`);
    return response.data;
  },

  enviar: async (
    clienteId: string,
    arquivo: File,
    validade?: string,
  ): Promise<Procuracao> => {
    const form = new FormData();
    form.append('clienteId', clienteId);
    form.append('arquivo', arquivo);
    if (validade) form.append('validade', validade);

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
