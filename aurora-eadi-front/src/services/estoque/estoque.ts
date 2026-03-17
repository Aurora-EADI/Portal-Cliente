import api from "@/lib/api";
import { TypeEstoque } from "./types/TypeEstoque";

export async function getEstoque(
  dtInicio: string,
  dtFim: string,
  nLote?: string,
  cliente?: string,
  reportType?: string,
): Promise<TypeEstoque[]> {
  const { data } = await api.get<TypeEstoque[]>("/estoque", {
    params: {
      dt_fim: dtFim,
      ...(dtInicio ? { dt_inicio: dtInicio } : {}),
      ...(nLote ? { n_lote: nLote } : {}),
      ...(cliente ? { cliente } : {}),
      ...(reportType ? { report_type: reportType } : {}),
    },
  });
  return data;
}
