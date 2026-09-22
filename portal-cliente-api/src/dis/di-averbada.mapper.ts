import { DiAverbada } from '@prisma/client';

/**
 * Shape que o frontend do agendamento espera na rota /agendamento/dis e no
 * stream — o tipo `DI` de lá. A fonte de verdade é `dis_averbadas` (o que o
 * Aurora averba); campos operacionais que a averbação ainda não conhece
 * (tipoContainer, pesoBruto, mercadoria, transportadora) saem vazios e são
 * preenchidos depois, no "Atribuir | Agendar".
 */
export interface DiParaAgendamento {
  id: string;
  numeroDI: string;
  cliente: string;
  container: string;
  tipoContainer: string;
  status: string;
  pesoBruto: number;
  mercadoria: string;
  transportadora: string;
  nLote: string;
  nConhecimento?: string;
  dta?: string;
  modalidade?: string;
  cnpjCliente?: string;
  codDespachante?: string;
  despachante?: string;
  localizacao?: string;
  averbadoEm?: string;
}

export function mapDiAverbadaToDI(d: DiAverbada): DiParaAgendamento {
  return {
    id: d.id,
    // numeroDI nunca vazio: cai no documento de saída e, no limite, no lote.
    numeroDI: d.numeroDI ?? d.documentoSaida ?? d.nLote,
    cliente: d.cliente ?? '',
    container: d.containers ?? '',
    tipoContainer: '',
    status: d.status,
    pesoBruto: 0,
    mercadoria: '',
    transportadora: '',
    nLote: d.nLote,
    nConhecimento: d.nConhecimento ?? undefined,
    dta: d.dta ?? undefined,
    modalidade: d.modalidade ?? undefined,
    cnpjCliente: d.cnpjCliente ?? undefined,
    codDespachante: d.codDespachante ?? undefined,
    despachante: d.despachante ?? undefined,
    localizacao: d.localizacao ?? undefined,
    averbadoEm: d.averbadoEm ? new Date(d.averbadoEm).toISOString() : undefined,
  };
}
