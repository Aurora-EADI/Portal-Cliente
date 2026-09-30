import { apiNest } from '@/lib/apiNest';
import type {
  AverbacaoDocumento,
  AverbacaoProcessoDetalhe,
  AverbacaoProcessoResumo,
  CriarAverbacaoDto,
  EditarAverbacaoDto,
} from '@/types/averbacao';
import type { ClienteResumo } from '@/types/procuracao';
import type { TipoDocumentoResumo } from '@/types/averbacao';

const BASE_PATH = '/averbacoes';

export const averbacoesService = {
  listar: async (): Promise<AverbacaoProcessoResumo[]> => {
    const response = await apiNest.get(BASE_PATH);
    return response.data;
  },

  detalhar: async (id: string): Promise<AverbacaoProcessoDetalhe> => {
    const response = await apiNest.get(`${BASE_PATH}/${id}`);
    return response.data;
  },

  criar: async (dto: CriarAverbacaoDto): Promise<AverbacaoProcessoResumo> => {
    const response = await apiNest.post(BASE_PATH, dto);
    return response.data;
  },

  /** Corrige dados de identificação — é também a resposta a uma devolução. */
  editar: async (
    id: string,
    dto: EditarAverbacaoDto,
  ): Promise<AverbacaoProcessoResumo> => {
    const response = await apiNest.patch(`${BASE_PATH}/${id}`, dto);
    return response.data;
  },

  /** Descarta o processo (vira CANCELADO; não apaga). Motivo obrigatório. */
  cancelar: async (
    id: string,
    motivo: string,
  ): Promise<AverbacaoProcessoResumo> => {
    const response = await apiNest.delete(`${BASE_PATH}/${id}`, {
      data: { motivo },
    });
    return response.data;
  },

  enviarDocumento: async (
    processoId: string,
    tipoDocumentoId: string,
    arquivo: File,
  ): Promise<AverbacaoDocumento> => {
    const form = new FormData();
    form.append('arquivo', arquivo);

    const response = await apiNest.post(
      `${BASE_PATH}/${processoId}/documentos/${tipoDocumentoId}`,
      form,
      // Deixa o browser montar o boundary do multipart.
      { headers: { 'Content-Type': undefined } },
    );
    return response.data;
  },

  /** Streaming autenticado — não há link público para o arquivo. */
  urlArquivo: (documentoId: string): string =>
    `${apiNest.defaults.baseURL}${BASE_PATH}/documentos/${documentoId}/arquivo`,

  clientesAutorizados: async (): Promise<ClienteResumo[]> => {
    const response = await apiNest.get('/procuracoes/clientes-autorizados');
    return response.data;
  },

  tiposPorModalidade: async (
    modalidade: string,
  ): Promise<TipoDocumentoResumo[]> => {
    const response = await apiNest.get('/tipos-documento', {
      params: { modalidade },
    });
    return response.data;
  },
};
