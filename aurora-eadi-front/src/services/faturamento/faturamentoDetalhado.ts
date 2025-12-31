import api from "@/lib/api";
import { FaturamentoDetalhado } from "@/services/faturamento/types/type_faturamentoDetalhado";
import { TypeBillingCutOff } from "@/services/faturamento/types/TypeBillingCutOff";

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

export async function getFaturamentoCutOff(): Promise<TypeBillingCutOff[]> {
  try {
    const { data } = await api.get<TypeBillingCutOff[]>("/faturamento/cutoff");
    return data;
  } catch (error) {
    console.error(error);
    return [];
  }
}
