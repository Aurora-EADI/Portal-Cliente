export interface ConferenciaCargaItem {
  conferenciaId: number;
  dtConferencia: string | null;
  despachante: string | null;
  representante: string | null;
  obs: string | null;
  cadUser: string | null;
  cadDate: string | null;
  nLote: string | number | null;
  nDocumento: string | null;
  nConhecimento: string | null;
  cliente: string | null;
  modalidade: string | null;
  concluido: "S" | "N";
  usuarioCadastro: string | null;
}

