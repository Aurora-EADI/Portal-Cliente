import axios from "axios";
import { FaturamentoPost } from "@/services/faturamento/type/type_faturamentoCutOff";

const api = axios.create({
  baseURL: "https://jsonplaceholder.typicode.com",
});

export async function getFaturamento(): Promise<FaturamentoPost[]> {
  const { data } = await api.get("/posts");
  return data; // sem mapeamento, retorno cru
}