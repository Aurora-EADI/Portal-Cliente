import axios from "axios";
import { FaturamentoDetalhado } from "@/services/faturamento/type/type_faturamentoDetalhado";

const api = axios.create({
  baseURL: "http://localhost:3333/api",
});

export async function getFaturamento(
  dataInicial: string,
  dataFinal: string
): Promise<FaturamentoDetalhado[]> {
  const { data } = await api.get("/faturamento", {
    params: {
      data_inicial: dataInicial,
      data_final: dataFinal,
    },
  });

  return data;
}