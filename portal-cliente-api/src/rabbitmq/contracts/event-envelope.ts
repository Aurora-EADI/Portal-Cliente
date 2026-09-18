import { z } from 'zod';

export const EVENT_TYPES = {
  DIS_AVERBADA_CREATED: 'dis.averbada.created',
  AGENDAMENTO_STATUS_CHANGED: 'agendamento.status-changed',
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
  diId: z.string().trim().min(1),
  numeroDI: z.string().trim().min(1),
  cpfMotorista: z.string().trim().min(1),
  placaVeiculo: z.string().trim().min(1),
  dtAverbacao: z.iso.datetime(),
  idContainers: z.array(z.string().trim().min(1)),
});

export const disAverbadaCreatedSchema = envelopeV1Schema.extend({
  eventType: z.literal(EVENT_TYPES.DIS_AVERBADA_CREATED),
  payload: disAverbadaPayloadSchema,
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
export type AgendamentoStatusChangedV2Event = z.infer<typeof agendamentoStatusChangedV2Schema>;

export function parseDisAverbadaCreated(input: unknown): DisAverbadaCreatedEvent {
  return disAverbadaCreatedSchema.parse(input);
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
