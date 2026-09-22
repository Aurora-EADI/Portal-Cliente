import { z } from 'zod';

export const EVENT_TYPES = {
  DIS_AVERBADA_CREATED: 'dis.averbada.created',
  // Aurora desaverbou a DI: o Cliente apaga a linha do dashboard.
  DIS_AVERBADA_REMOVED: 'dis.averbada.removed',
  AGENDAMENTO_STATUS_CHANGED: 'agendamento.status-changed',
  // Publicado quando uma ação do despachante muda o processo de averbação
  // (envio/substituição de documento). É o gatilho para a fila de validação do
  // Portal Aurora se atualizar sozinha, sem depender de recarregar a tela.
  AVERBACAO_PROCESSO_ATUALIZADO: 'averbacao.processo.atualizado',
  AGENDAMENTO_COMMAND_REJECTED: 'agendamento.command-rejected',
  AGENDAMENTO_COMMAND_COMPLETED: 'agendamento.command-completed',
} as const;

const envelopeV1Schema = z.object({
  eventId: z.uuid(),
  eventType: z.string(),
  version: z.literal(1),
  occurredAt: z.iso.datetime(),
  source: z.string().min(1),
  correlationId: z.uuid().nullable(),
  payload: z.unknown(),
});

const envelopeSchema = z.object({
  eventId: z.uuid(),
  eventType: z.string(),
  version: z.number().int().positive(),
  occurredAt: z.iso.datetime(),
  source: z.string().min(1),
  correlationId: z.uuid().nullable(),
  causationId: z.uuid().optional(),
  payload: z.unknown(),
});

const disAverbadaPayloadSchema = z.object({
  // Contrato Aurora v1: chave autoritativa já existente no Portal Cliente.
  // Nunca derivar de diId ou numeroDI.
  nLote: z.string().trim().min(1),
  dtAverbacao: z.iso.datetime(),
  idContainers: z.array(z.string().trim().min(1)).default([]),

  // Motorista/veículo não existem no momento da averbação — só são atribuídos
  // depois, do lado do cliente, no "Atribuir | Agendar". Por isso são opcionais
  // aqui: o Aurora publica a DI liberada sem eles, e o cliente os preenche.
  diId: z.string().trim().min(1).nullish(),
  numeroDI: z.string().trim().min(1).nullish(),
  cpfMotorista: z.string().trim().min(1).nullish(),
  placaVeiculo: z.string().trim().min(1).nullish(),

  // Campos descritivos que o dashboard de agendamento exibe (cliente,
  // despachante, modalidade…). O Aurora já os tem no momento da averbação; sem
  // eles a linha em dis_averbadas apareceria em branco.
  nConhecimento: z.string().nullish(),
  dta: z.string().nullish(),
  documentoSaida: z.string().nullish(),
  tipoDocumento: z.string().nullish(),
  modalidade: z.string().nullish(),
  cliente: z.string().nullish(),
  cnpjCliente: z.string().nullish(),
  codDespachante: z.string().nullish(),
  despachante: z.string().nullish(),
  saldo: z.number().nullish(),
  dtEntrada: z.iso.datetime().nullish(),
  localizacao: z.string().nullish(),
  containers: z.string().nullish(),
});

export const disAverbadaCreatedSchema = envelopeV1Schema.extend({
  eventType: z.literal(EVENT_TYPES.DIS_AVERBADA_CREATED),
  payload: disAverbadaPayloadSchema,
});

const averbacaoProcessoAtualizadoPayloadSchema = z.object({
  processoId: z.string().trim().min(1),
  clienteId: z.string().trim().min(1),
  // Nulo enquanto o processo não foi vinculado a um despachante do SIAUM.
  despachanteId: z.string().trim().min(1).nullable(),
  status: z.string().trim().min(1),
});

export const averbacaoProcessoAtualizadoSchema = envelopeSchema.extend({
  eventType: z.literal(EVENT_TYPES.AVERBACAO_PROCESSO_ATUALIZADO),
  payload: averbacaoProcessoAtualizadoPayloadSchema,
});

const agendamentoStatusSchema = z.enum([
  'ATIVO',
  'CANCELADO',
  'CHEGOU',
  'NO_SHOW',
  'ON_TIME',
  'ATRASADO',
  'AG_CHEGADA',
  'CONCLUIDO',
]);

const agendamentoStatusChangedV2PayloadSchema = z.object({
  agendamentoId: z.uuid(),
  status: agendamentoStatusSchema,
  previousStatus: agendamentoStatusSchema,
  changedAt: z.iso.datetime(),
  aggregateVersion: z.number().int().safe().min(1),
}).strict();

export const agendamentoStatusChangedV2Schema = envelopeSchema.extend({
  eventType: z.literal(EVENT_TYPES.AGENDAMENTO_STATUS_CHANGED),
  version: z.literal(2),
  source: z.literal('portal-cliente'),
  payload: agendamentoStatusChangedV2PayloadSchema,
});

export type EventEnvelope<TPayload = unknown> = {
  eventId: string;
  eventType: string;
  version: number;
  occurredAt: string;
  source: string;
  correlationId: string | null;
  causationId?: string;
  payload: TPayload;
};
export type DisAverbadaCreatedEvent = z.infer<typeof disAverbadaCreatedSchema>;
export type AverbacaoProcessoAtualizadoEvent = z.infer<
  typeof averbacaoProcessoAtualizadoSchema
>;
export type AgendamentoStatusChangedV2Event = z.infer<typeof agendamentoStatusChangedV2Schema>;

export function parseDisAverbadaCreated(input: unknown): DisAverbadaCreatedEvent {
  return disAverbadaCreatedSchema.parse(input);
}

const disAverbadaRemovedPayloadSchema = z.object({
  nLote: z.string().trim().min(1),
});

export const disAverbadaRemovedSchema = envelopeSchema.extend({
  eventType: z.literal(EVENT_TYPES.DIS_AVERBADA_REMOVED),
  payload: disAverbadaRemovedPayloadSchema,
});

export type DisAverbadaRemovedEvent = z.infer<typeof disAverbadaRemovedSchema>;

export function parseDisAverbadaRemoved(input: unknown): DisAverbadaRemovedEvent {
  return disAverbadaRemovedSchema.parse(input);
}

export function parseAgendamentoStatusChangedV2(input: unknown): AgendamentoStatusChangedV2Event {
  return agendamentoStatusChangedV2Schema.parse(input);
}

export function parseEvent(input: unknown): DisAverbadaCreatedEvent | AgendamentoStatusChangedV2Event {
  if (input === null || typeof input !== 'object') {
    throw new Error('UNSUPPORTED_EVENT');
  }

  const candidate = input as Record<string, unknown>;
  if (candidate.eventType === EVENT_TYPES.DIS_AVERBADA_CREATED && candidate.version === 1) {
    return parseDisAverbadaCreated(input);
  }
  if (candidate.eventType === EVENT_TYPES.AGENDAMENTO_STATUS_CHANGED && candidate.version === 2) {
    return parseAgendamentoStatusChangedV2(input);
  }
  throw new Error('UNSUPPORTED_EVENT');
}

export function serializeEvent(input: unknown): string {
  return JSON.stringify(parseEvent(input));
}
