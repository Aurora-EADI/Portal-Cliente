export interface TypeConferenciaCarga {
  conferenciaId: number;
  dtConferencia: Date | null;
  despachante: string | null;
  representante: string | null;
  obs: string | null;
  cadUser: string | null;
  cadDate: Date | null;
  nLote: string | number | null;
  nDocumento: string | null;
  nConhecimento: string | null;
  cliente: string | null;
  modalidade: string | null;
  concluido: "S" | "N";
  usuarioCadastro: string | null;
}

