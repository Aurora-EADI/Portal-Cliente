import axios from "axios";
import { FaturamentoDetalhado } from "@/services/faturamento/type/type_faturamentoDetalhado";

const api = axios.create({
  baseURL: "http://localhost:3333/api",
});

export async function getFaturamento(): Promise<FaturamentoDetalhado[]> {
  const { data } = await api.get("/faturamento");
  return data; // sem mapeamento, retorno cru
}