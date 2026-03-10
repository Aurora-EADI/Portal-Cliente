import api from "@/lib/api";
import { TypeEstoque } from "./types/TypeEstoque";

export async function getEstoque(
  dtInicio: string,
  dtFim: string,
  nLote?: string,
  cliente?: string,
): Promise<TypeEstoque[]> {
  const { data } = await api.get<TypeEstoque[]>("/estoque", {
    params: {
      dt_inicio: dtInicio,
      dt_fim: dtFim,
      ...(nLote ? { n_lote: nLote } : {}),
      ...(cliente ? { cliente } : {}),
    },
  });
  return data;
}
