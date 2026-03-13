export interface TypeEstoque {
  ano: number | null;
  dt_entrada: Date | null;
  n_lote: string | null;
  n_conhecimento: string | null;
  cliente: string | null;
  status_estoque: string | null;
  n_da: string | null;
  dta: string | null;
  container: string | null;
  "Saldo_(Vol)": string | null;
  "Saldo_Valor_(US$)": string | null;
  valor_cif_total: string | null;
  m3_total: string | null;
  qtd_container: number | null;
}
