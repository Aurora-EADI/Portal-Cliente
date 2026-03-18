import { api } from "@/lib/api";
import { ConferenciaCargaItem } from "@/types";

export async function getConferenciaCargaOpen(): Promise<ConferenciaCargaItem[]> {
  try {
    const { data } = await api.get<ConferenciaCargaItem[]>("/conferencia-carga");
    return data;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string | string[] } } };
    const backendMessage = err.response?.data?.message;
    let message = "Erro ao buscar Conferencia de Carga";

    if (typeof backendMessage === "string") {
      message = backendMessage;
    } else if (Array.isArray(backendMessage)) {
      message = backendMessage.join(", ");
    }

    return Promise.reject(new Error(message));
  }
}

